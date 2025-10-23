import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semilla } from './entities/semilla.entity';
import { CreateSemillaDto } from './dto/create-semilla.dto';
import { UpdateSemillaDto } from './dto/update-semilla.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class SemillasService {
  constructor(
    @InjectRepository(Semilla)
    private readonly semillaRepository: Repository<Semilla>,
  ) {}

  async create(createSemillaDto: CreateSemillaDto): Promise<Semilla> {
    const existingSemilla = await this.semillaRepository.findOne({
      where: { nombre: createSemillaDto.nombre },
    });

    if (existingSemilla) {
      throw new ConflictException('Ya existe una semilla con ese nombre');
    }

    const semilla = this.semillaRepository.create(createSemillaDto);
    return await this.semillaRepository.save(semilla);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.semillaRepository.createQueryBuilder('semilla');

    // Búsqueda por nombre
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere('semilla.nombre LIKE :search', {
        search: searchTerm,
      });
    }

    // Orden descendente por id
    queryBuilder.orderBy('semilla.nombre', 'ASC');

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

  async findAllActive(): Promise<Semilla[]> {
    return await this.semillaRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Semilla> {
    const semilla = await this.semillaRepository.findOne({
      where: { id_semilla: id },
    });

    if (!semilla) {
      throw new NotFoundException(`Semilla con ID ${id} no encontrada`);
    }

    return semilla;
  }

  async update(
    id: number,
    updateSemillaDto: UpdateSemillaDto,
  ): Promise<Semilla> {
    const semilla = await this.findOne(id);

    if (updateSemillaDto.nombre && updateSemillaDto.nombre !== semilla.nombre) {
      const existingSemilla = await this.semillaRepository.findOne({
        where: { nombre: updateSemillaDto.nombre },
      });

      if (existingSemilla) {
        throw new ConflictException('Ya existe una semilla con ese nombre');
      }
    }

    Object.assign(semilla, updateSemillaDto);
    return await this.semillaRepository.save(semilla);
  }

  async remove(id: number): Promise<void> {
    const semilla = await this.findOne(id);
    await this.semillaRepository.remove(semilla);
  }

  async toggleActive(id: number): Promise<Semilla> {
    const semilla = await this.findOne(id);
    semilla.activo = !semilla.activo;
    return await this.semillaRepository.save(semilla);
  }
}
