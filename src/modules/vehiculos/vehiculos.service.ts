import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existingVehiculo = await this.vehiculoRepository.findOne({
      where: { placa: createVehiculoDto.placa },
    });

    if (existingVehiculo) {
      throw new ConflictException('Ya existe un vehículo con esa placa');
    }

    const vehiculo = this.vehiculoRepository.create(createVehiculoDto);
    return await this.vehiculoRepository.save(vehiculo);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vehiculoRepository.createQueryBuilder('vehiculo');

    // Búsqueda por placa, marca o modelo
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(vehiculo.placa LIKE :search OR vehiculo.marca LIKE :search OR vehiculo.modelo LIKE :search)',
        { search: searchTerm },
      );
    }

    queryBuilder.orderBy('vehiculo.id_vehiculo', 'DESC');
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

  async findAllActive(): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      where: { activo: true },
      order: { placa: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { id_vehiculo: id },
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    return vehiculo;
  }

  async update(
    id: number,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);

    if (updateVehiculoDto.placa && updateVehiculoDto.placa !== vehiculo.placa) {
      const existingVehiculo = await this.vehiculoRepository.findOne({
        where: { placa: updateVehiculoDto.placa },
      });

      if (existingVehiculo) {
        throw new ConflictException('Ya existe un vehículo con esa placa');
      }
    }

    Object.assign(vehiculo, updateVehiculoDto);
    return await this.vehiculoRepository.save(vehiculo);
  }

  async remove(id: number): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.vehiculoRepository.remove(vehiculo);
  }

  async toggleActive(id: number): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    vehiculo.activo = !vehiculo.activo;
    return await this.vehiculoRepository.save(vehiculo);
  }
}
