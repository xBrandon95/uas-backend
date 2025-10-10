import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cooperador } from './entities/cooperador.entity';
import { CreateCooperadorDto } from './dto/create-cooperador.dto';
import { UpdateCooperadorDto } from './dto/update-cooperador.dto';

@Injectable()
export class CooperadoresService {
  constructor(
    @InjectRepository(Cooperador)
    private readonly cooperadorRepository: Repository<Cooperador>,
  ) {}

  async create(createCooperadorDto: CreateCooperadorDto): Promise<Cooperador> {
    const cooperador = this.cooperadorRepository.create(createCooperadorDto);
    return await this.cooperadorRepository.save(cooperador);
  }

  async findAll(): Promise<Cooperador[]> {
    return await this.cooperadorRepository.find({
      relations: ['semillera'],
      order: { nombre: 'ASC' },
    });
  }

  async findAllActive(): Promise<Cooperador[]> {
    return await this.cooperadorRepository.find({
      where: { activo: true },
      relations: ['semillera'],
      order: { nombre: 'ASC' },
    });
  }

  async findBySemillera(idSemillera: number): Promise<Cooperador[]> {
    return await this.cooperadorRepository.find({
      where: { id_semillera: idSemillera, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Cooperador> {
    const cooperador = await this.cooperadorRepository.findOne({
      where: { id_cooperador: id },
      relations: ['semillera'],
    });

    if (!cooperador) {
      throw new NotFoundException(`Cooperador con ID ${id} no encontrado`);
    }

    return cooperador;
  }

  async update(
    id: number,
    updateCooperadorDto: UpdateCooperadorDto,
  ): Promise<Cooperador> {
    const cooperador = await this.findOne(id);
    Object.assign(cooperador, updateCooperadorDto);
    return await this.cooperadorRepository.save(cooperador);
  }

  async remove(id: number): Promise<void> {
    const cooperador = await this.findOne(id);
    await this.cooperadorRepository.remove(cooperador);
  }

  async toggleActive(id: number): Promise<Cooperador> {
    const cooperador = await this.findOne(id);
    cooperador.activo = !cooperador.activo;
    return await this.cooperadorRepository.save(cooperador);
  }
}
