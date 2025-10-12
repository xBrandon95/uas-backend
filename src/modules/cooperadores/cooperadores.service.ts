import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cooperador } from './entities/cooperador.entity';
import { CreateCooperadorDto } from './dto/create-cooperador.dto';
import { UpdateCooperadorDto } from './dto/update-cooperador.dto';
import { PaginationDto } from './dto/pagination.dto';

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

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.cooperadorRepository
      .createQueryBuilder('cooperador')
      .leftJoinAndSelect('cooperador.semillera', 'semillera');

    if (search.trim()) {
      const searchTerm = search.trim();
      queryBuilder.andWhere(
        '(cooperador.nombre LIKE :search OR cooperador.ci LIKE :search OR semillera.nombre LIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }
    // Orden descendente por id
    queryBuilder.orderBy('cooperador.id_cooperador', 'DESC');
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
    await this.findOne(id);
    await this.cooperadorRepository.update(id, updateCooperadorDto);
    return await this.findOne(id);
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
