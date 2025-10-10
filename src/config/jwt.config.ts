import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_super_segura',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
