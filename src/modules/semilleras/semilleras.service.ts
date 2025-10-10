import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semillera } from './entities/semillera.entity';
import { CreateSemilleraDto } from './dto/create-semillera.dto';
import { UpdateSemilleraDto } from './dto/update-semillera.dto';

@Injectable()
export class SemillerasService {
  constructor(
    @InjectRepository(Semillera)
    private readonly semilleraRepository: Repository<Semillera>,
  ) {}

  async create(createSemilleraDto: CreateSemilleraDto): Promise<Semillera> {
    const existingSemillera = await this.semilleraRepository.findOne({
      where: { nombre: createSemilleraDto.nombre },
    });

    if (existingSemillera) {
      throw new ConflictException('Ya existe una semillera con ese nombre');
    }

    const semillera = this.semilleraRepository.create(createSemilleraDto);
    return await this.semilleraRepository.save(semillera);
  }

  async findAll(): Promise<Semillera[]> {
    return await this.semilleraRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findAllActive(): Promise<Semillera[]> {
    return await this.semilleraRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Semillera> {
    const semillera = await this.semilleraRepository.findOne({
      where: { id_semillera: id },
    });

    if (!semillera) {
      throw new NotFoundException(`Semillera con ID ${id} no encontrada`);
    }

    return semillera;
  }

  async update(
    id: number,
    updateSemilleraDto: UpdateSemilleraDto,
  ): Promise<Semillera> {
    const semillera = await this.findOne(id);

    if (
      updateSemilleraDto.nombre &&
      updateSemilleraDto.nombre !== semillera.nombre
    ) {
      const existingSemillera = await this.semilleraRepository.findOne({
        where: { nombre: updateSemilleraDto.nombre },
      });

      if (existingSemillera) {
        throw new ConflictException('Ya existe una semillera con ese nombre');
      }
    }

    Object.assign(semillera, updateSemilleraDto);
    return await this.semilleraRepository.save(semillera);
  }

  async remove(id: number): Promise<void> {
    const semillera = await this.findOne(id);
    await this.semilleraRepository.remove(semillera);
  }

  async toggleActive(id: number): Promise<Semillera> {
    const semillera = await this.findOne(id);
    semillera.activo = !semillera.activo;
    return await this.semilleraRepository.save(semillera);
  }
}
