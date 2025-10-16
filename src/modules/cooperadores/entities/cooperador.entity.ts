import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cooperadores')
export class Cooperador {
  @PrimaryGeneratedColumn()
  id_cooperador: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 50, unique: true })
  ci: string;

  @Column({ length: 50, nullable: true })
  telefono: string;
}
