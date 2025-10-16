import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('semillas')
export class Semilla {
  @PrimaryGeneratedColumn()
  id_semilla: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ default: true })
  activo: boolean;
}
