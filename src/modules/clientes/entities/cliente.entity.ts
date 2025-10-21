import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id_cliente: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  nit: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ length: 300, nullable: true })
  direccion: string;
}
