import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Semilla } from '../../semillas/entities/semilla.entity';

@Entity('variedades')
export class Variedad {
  @PrimaryGeneratedColumn()
  id_variedad: number;

  @Column()
  id_semilla: number;

  @ManyToOne(() => Semilla)
  @JoinColumn({ name: 'id_semilla' })
  semilla: Semilla;

  @Column({ length: 100 })
  nombre: string;
}
