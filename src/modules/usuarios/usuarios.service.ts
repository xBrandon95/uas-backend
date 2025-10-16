import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';
import { Unidad } from '../unidades/entities/unidad.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { usuario: createUsuarioDto.usuario },
    });

    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const usuario = this.usuarioRepository.create(createUsuarioDto);
    return await this.usuarioRepository.save(usuario);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search = '', page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.unidad', 'unidad');

    if (search.trim()) {
      const searchTerm = search.trim();
      queryBuilder.andWhere(
        '(usuario.nombre LIKE :search OR usuario.usuario LIKE :search OR unidad.nombre LIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }
    // Orden descendente por id
    queryBuilder.orderBy('usuario.id_usuario', 'DESC');
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

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['unidad'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async findByUsername(usuario: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { usuario },
      select: [
        'id_usuario',
        'nombre',
        'usuario',
        'password',
        'rol',
        'activo',
        'id_unidad',
      ],
    });
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Verificar si el nuevo nombre de usuario está en uso
    if (
      updateUsuarioDto.usuario &&
      updateUsuarioDto.usuario !== usuario.usuario
    ) {
      const existingUser = await this.usuarioRepository.findOne({
        where: { usuario: updateUsuarioDto.usuario },
      });

      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // Asignar los campos simples
    Object.assign(usuario, updateUsuarioDto);

    // 🔥 Manejar cambio de relación unidad
    if (updateUsuarioDto.id_unidad) {
      const unidad = await this.unidadRepository.findOne({
        where: { id_unidad: updateUsuarioDto.id_unidad },
      });

      if (!unidad) {
        throw new NotFoundException('La unidad especificada no existe');
      }

      usuario.unidad = unidad;
    }

    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }

  async toggleActive(id: number): Promise<Usuario> {
    const usuario = await this.findOne(id);
    usuario.activo = !usuario.activo;
    return await this.usuarioRepository.save(usuario);
  }
}
