import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id_vehiculo: number;

  @Column({ length: 20, unique: true })
  placa: string;

  @Column({ length: 100, nullable: true })
  marca_modelo: string;
}
