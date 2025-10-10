import { Role } from '../enums/roles.enum';

export interface JwtPayload {
  sub: number;
  usuario: string;
  rol: Role;
}

export interface AuthenticatedUser {
  id_usuario: number;
  usuario: string;
  rol: Role;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: {
    id_usuario: number;
    nombre: string;
    usuario: string;
    rol: Role;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}
