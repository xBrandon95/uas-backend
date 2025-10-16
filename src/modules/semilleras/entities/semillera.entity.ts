import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('semilleras')
export class Semillera {
  @PrimaryGeneratedColumn()
  id_semillera: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 300, nullable: true })
  direccion: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ default: true })
  activo: boolean;
}
