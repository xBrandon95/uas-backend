import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conductores')
export class Conductor {
  @PrimaryGeneratedColumn()
  id_conductor: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 50 })
  ci: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ length: 50, nullable: true })
  licencia: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
