import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs('database', () => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT!, 10) || 3306,
  username: process.env.DB_USERNAME || 'semillas_user',
  password: process.env.DB_PASSWORD || 'semillas_pass',
  database: process.env.DB_DATABASE || 'semillas_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  timezone: 'Z',
  charset: 'utf8mb4',
}));

// DataSource para migraciones
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT!, 10) || 3306,
  username: process.env.DB_USERNAME || 'semillas_user',
  password: process.env.DB_PASSWORD || 'semillas_pass',
  database: process.env.DB_DATABASE || 'semillas_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  timezone: 'Z',
  charset: 'utf8mb4',
} as DataSourceOptions);
