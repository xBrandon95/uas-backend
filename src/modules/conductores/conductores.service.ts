import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conductor } from './entities/conductor.entity';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class ConductoresService {
  constructor(
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
  ) {}

  async create(createConductorDto: CreateConductorDto): Promise<Conductor> {
    const existingConductor = await this.conductorRepository.findOne({
      where: { ci: createConductorDto.ci },
    });

    if (existingConductor) {
      throw new ConflictException('Ya existe un conductor con ese CI');
    }

    const conductor = this.conductorRepository.create(createConductorDto);
    return await this.conductorRepository.save(conductor);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.conductorRepository.createQueryBuilder('conductor');

    // Búsqueda por nombre o CI
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(conductor.nombre LIKE :search OR conductor.ci LIKE :search)',
        { search: searchTerm },
      );
    }
    // Orden alfabético por nombre
    queryBuilder.orderBy('conductor.nombre', 'DESC');
    // Paginación
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllActive(): Promise<Conductor[]> {
    return await this.conductorRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Conductor> {
    const conductor = await this.conductorRepository.findOne({
      where: { id_conductor: id },
    });

    if (!conductor) {
      throw new NotFoundException(`Conductor con ID ${id} no encontrado`);
    }

    return conductor;
  }

  async update(
    id: number,
    updateConductorDto: UpdateConductorDto,
  ): Promise<Conductor> {
    const conductor = await this.findOne(id);

    if (updateConductorDto.ci && updateConductorDto.ci !== conductor.ci) {
      const existingConductor = await this.conductorRepository.findOne({
        where: { ci: updateConductorDto.ci },
      });

      if (existingConductor) {
        throw new ConflictException('Ya existe un conductor con ese CI');
      }
    }

    Object.assign(conductor, updateConductorDto);
    return await this.conductorRepository.save(conductor);
  }

  async remove(id: number): Promise<void> {
    const conductor = await this.findOne(id);
    await this.conductorRepository.remove(conductor);
  }
}
