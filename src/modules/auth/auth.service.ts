import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import {
  JwtPayload,
  LoginResponse,
  RefreshTokenResponse,
} from '../../common/interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const usuario = await this.validateUser(
      loginDto.usuario,
      loginDto.password,
    );

    console.log(usuario);

    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      usuario: usuario.usuario,
      rol: usuario.rol,
      id_unidad: usuario.id_unidad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        rol: usuario.rol,
        id_unidad: usuario.id_unidad,
      },
    };
  }

  async register(createUsuarioDto: CreateUsuarioDto): Promise<LoginResponse> {
    const usuario = await this.usuariosService.create(createUsuarioDto);

    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      usuario: usuario.usuario,
      rol: usuario.rol,
      id_unidad: usuario.id_unidad, // NUEVO
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        rol: usuario.rol,
        id_unidad: usuario.id_unidad, // NUEVO
      },
    };
  }

  refreshToken(refreshToken: string): RefreshTokenResponse {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const newPayload: JwtPayload = {
        sub: payload.sub,
        usuario: payload.usuario,
        rol: payload.rol,
        id_unidad: payload.id_unidad, // NUEVO
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: this.configService.get('jwt.refreshSecret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        }),
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private async validateUser(
    usuario: string,
    password: string,
  ): Promise<Usuario> {
    const user = await this.usuariosService.findByUsername(usuario);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }
}
