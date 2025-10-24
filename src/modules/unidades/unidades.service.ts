import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unidad } from './entities/unidad.entity';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class UnidadesService {
  constructor(
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
  ) {}

  async create(createUnidadDto: CreateUnidadDto): Promise<Unidad> {
    const existingUnidad = await this.unidadRepository.findOne({
      where: { nombre: createUnidadDto.nombre },
    });

    if (existingUnidad) {
      throw new ConflictException('Ya existe una unidad con ese nombre');
    }

    const unidad = this.unidadRepository.create(createUnidadDto);
    return await this.unidadRepository.save(unidad);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.unidadRepository.createQueryBuilder('unidad');

    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(unidad.nombre LIKE :search OR unidad.ubicacion LIKE :search)',
        { search: searchTerm },
      );
    }

    // Orden descendente por id
    queryBuilder.orderBy('unidad.id_unidad', 'DESC');

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

  async findAllNoPagination() {
    return await this.unidadRepository
      .createQueryBuilder('unidad')
      .where('unidad.activo = :activo', { activo: true })
      .orderBy('unidad.id_unidad', 'DESC')
      .getMany();
  }

  async findAllActive(): Promise<Unidad[]> {
    return await this.unidadRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Unidad> {
    const unidad = await this.unidadRepository.findOne({
      where: { id_unidad: id },
    });

    if (!unidad) {
      throw new NotFoundException(`Unidad con ID ${id} no encontrada`);
    }

    return unidad;
  }

  async update(id: number, updateUnidadDto: UpdateUnidadDto): Promise<Unidad> {
    const unidad = await this.findOne(id);

    if (updateUnidadDto.nombre && updateUnidadDto.nombre !== unidad.nombre) {
      const existingUnidad = await this.unidadRepository.findOne({
        where: { nombre: updateUnidadDto.nombre },
      });

      if (existingUnidad) {
        throw new ConflictException('Ya existe una unidad con ese nombre');
      }
    }

    Object.assign(unidad, updateUnidadDto);
    return await this.unidadRepository.save(unidad);
  }

  async remove(id: number): Promise<void> {
    const unidad = await this.findOne(id);
    await this.unidadRepository.remove(unidad);
  }

  async toggleActive(id: number): Promise<Unidad> {
    const unidad = await this.findOne(id);
    unidad.activo = !unidad.activo;
    return await this.unidadRepository.save(unidad);
  }
}
