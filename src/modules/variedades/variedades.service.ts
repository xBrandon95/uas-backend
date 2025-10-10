import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variedad } from './entities/variedad.entity';
import { CreateVariedadDto } from './dto/create-variedad.dto';
import { UpdateVariedadDto } from './dto/update-variedad.dto';

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

  async findAll(): Promise<Variedad[]> {
    return await this.variedadRepository.find({
      relations: ['semilla'],
      order: { nombre: 'ASC' },
    });
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
    const variedad = await this.findOne(id);
    Object.assign(variedad, updateVariedadDto);
    return await this.variedadRepository.save(variedad);
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
