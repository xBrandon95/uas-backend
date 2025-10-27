import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'semillas_user',
  password: 'semillas_pass',
  database: 'semillas_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
