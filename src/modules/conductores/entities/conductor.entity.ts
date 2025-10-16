import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
