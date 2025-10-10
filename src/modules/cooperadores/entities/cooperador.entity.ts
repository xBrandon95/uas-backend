import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Semillera } from '../../semilleras/entities/semillera.entity';

@Entity('cooperadores')
export class Cooperador {
  @PrimaryGeneratedColumn()
  id_cooperador: number;

  @Column()
  id_semillera: number;

  @ManyToOne(() => Semillera)
  @JoinColumn({ name: 'id_semillera' })
  semillera: Semillera;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  ci: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ length: 300, nullable: true })
  direccion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
