import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('semillas')
export class Semilla {
  @PrimaryGeneratedColumn()
  id_semilla: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100, nullable: true })
  tipo: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
