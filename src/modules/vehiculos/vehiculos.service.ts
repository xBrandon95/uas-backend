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

  async findAll(): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      order: { placa: 'ASC' },
    });
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
