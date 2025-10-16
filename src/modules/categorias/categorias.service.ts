import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    const existingCategoria = await this.categoriaRepository.findOne({
      where: { nombre: createCategoriaDto.nombre },
    });

    if (existingCategoria) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const categoria = this.categoriaRepository.create(createCategoriaDto);
    return await this.categoriaRepository.save(categoria);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.categoriaRepository.createQueryBuilder('categoria');

    // Búsqueda por nombre
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere('categoria.nombre LIKE :search', {
        search: searchTerm,
      });
    }

    // Orden descendente por id (igual que en unidades)
    queryBuilder.orderBy('categoria.id_categoria', 'DESC');

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

  async findAllActive(): Promise<Categoria[]> {
    return await this.categoriaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id_categoria: id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(
    id: number,
    updateCategoriaDto: UpdateCategoriaDto,
  ): Promise<Categoria> {
    const categoria = await this.findOne(id);

    if (
      updateCategoriaDto.nombre &&
      updateCategoriaDto.nombre !== categoria.nombre
    ) {
      const existingCategoria = await this.categoriaRepository.findOne({
        where: { nombre: updateCategoriaDto.nombre },
      });

      if (existingCategoria) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    Object.assign(categoria, updateCategoriaDto);
    return await this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.findOne(id);
    await this.categoriaRepository.remove(categoria);
  }
}
