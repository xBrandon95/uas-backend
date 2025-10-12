import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variedad } from './entities/variedad.entity';
import { CreateVariedadDto } from './dto/create-variedad.dto';
import { UpdateVariedadDto } from './dto/update-variedad.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class VariedadesService {
  constructor(
    @InjectRepository(Variedad)
    private readonly variedadRepository: Repository<Variedad>,
  ) {}

  async create(createVariedadDto: CreateVariedadDto): Promise<Variedad> {
    const variedad = this.variedadRepository.create(createVariedadDto);
    return await this.variedadRepository.save(variedad);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.variedadRepository
      .createQueryBuilder('variedad')
      .leftJoinAndSelect('variedad.semilla', 'semilla');

    if (search.trim()) {
      const searchTerm = search.trim();
      queryBuilder.andWhere(
        '(variedad.nombre LIKE :search OR semilla.nombre LIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }
    // Orden descendente por id
    queryBuilder.orderBy('variedad.id_variedad', 'DESC');
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

  async findAllActive(): Promise<Variedad[]> {
    return await this.variedadRepository.find({
      where: { activo: true },
      relations: ['semilla'],
      order: { nombre: 'ASC' },
    });
  }

  async findBySemilla(idSemilla: number): Promise<Variedad[]> {
    return await this.variedadRepository.find({
      where: { id_semilla: idSemilla, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Variedad> {
    const variedad = await this.variedadRepository.findOne({
      where: { id_variedad: id },
      relations: ['semilla'],
    });

    if (!variedad) {
      throw new NotFoundException(`Variedad con ID ${id} no encontrada`);
    }

    return variedad;
  }

  async update(
    id: number,
    updateVariedadDto: UpdateVariedadDto,
  ): Promise<Variedad> {
    await this.findOne(id);
    await this.variedadRepository.update(id, updateVariedadDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const variedad = await this.findOne(id);
    await this.variedadRepository.remove(variedad);
  }

  async toggleActive(id: number): Promise<Variedad> {
    const variedad = await this.findOne(id);
    variedad.activo = !variedad.activo;
    return await this.variedadRepository.save(variedad);
  }
}
