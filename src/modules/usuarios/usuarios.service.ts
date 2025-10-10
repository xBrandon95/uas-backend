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

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
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

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      relations: ['unidad'],
      order: { fecha_creacion: 'DESC' },
    });
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
      select: ['id_usuario', 'nombre', 'usuario', 'password', 'rol', 'activo'],
    });
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Si se está actualizando el nombre de usuario, verificar que no exista
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

    Object.assign(usuario, updateUsuarioDto);
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
