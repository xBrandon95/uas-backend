import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(createServicioDto: CreateServicioDto): Promise<Servicio> {
    // Validar que no exista un servicio con el mismo nombre
    const existente = await this.servicioRepository.findOne({
      where: { nombre: createServicioDto.nombre },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un servicio con el nombre "${createServicioDto.nombre}"`,
      );
    }

    const servicio = this.servicioRepository.create(createServicioDto);
    return await this.servicioRepository.save(servicio);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<{ data: Servicio[]; meta: any }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.servicioRepository
      .createQueryBuilder('servicio')
      .orderBy('servicio.nombre', 'ASC');

    // Búsqueda por nombre o descripción
    if (search) {
      queryBuilder.where(
        '(servicio.nombre LIKE :search OR servicio.descripcion LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

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

  async findAllActive(): Promise<Servicio[]> {
    return await this.servicioRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { id_servicio: id },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return servicio;
  }

  async findByNombre(nombre: string): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { nombre },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio "${nombre}" no encontrado`);
    }

    return servicio;
  }

  async update(
    id: number,
    updateServicioDto: UpdateServicioDto,
  ): Promise<Servicio> {
    const servicio = await this.findOne(id);

    // Si se está actualizando el nombre, validar que no exista otro servicio con ese nombre
    if (
      updateServicioDto.nombre &&
      updateServicioDto.nombre !== servicio.nombre
    ) {
      const existente = await this.servicioRepository.findOne({
        where: { nombre: updateServicioDto.nombre },
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe un servicio con el nombre "${updateServicioDto.nombre}"`,
        );
      }
    }

    Object.assign(servicio, updateServicioDto);
    return await this.servicioRepository.save(servicio);
  }

  async toggleActivo(id: number): Promise<Servicio> {
    const servicio = await this.findOne(id);
    servicio.activo = !servicio.activo;
    return await this.servicioRepository.save(servicio);
  }

  async remove(id: number): Promise<void> {
    const servicio = await this.findOne(id);

    await this.servicioRepository.remove(servicio);
  }

  async getEstadisticas(): Promise<any> {
    const total = await this.servicioRepository.count();
    const activos = await this.servicioRepository.count({
      where: { activo: true },
    });
    const inactivos = total - activos;

    return {
      total,
      activos,
      inactivos,
    };
  }
}
