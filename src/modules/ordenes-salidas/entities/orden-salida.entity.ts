import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Semillera } from '../../semilleras/entities/semillera.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Conductor } from '../../conductores/entities/conductor.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Unidad } from '../../unidades/entities/unidad.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Semilla } from '../../semillas/entities/semilla.entity';
import { DetalleOrdenSalida } from './detalle-orden-salida.entity';

@Entity('ordenes_salida')
export class OrdenSalida {
  @PrimaryGeneratedColumn()
  id_orden_salida: number;

  @Column({ unique: true, length: 50 })
  numero_orden: string;

  @Column()
  id_semillera: number;

  @ManyToOne(() => Semillera)
  @JoinColumn({ name: 'id_semillera' })
  semillera: Semillera;

  // ✅ NUEVO CAMPO: ID de la semilla
  @Column()
  id_semilla: number;

  @ManyToOne(() => Semilla)
  @JoinColumn({ name: 'id_semilla' })
  semilla: Semilla;

  @Column()
  id_cliente: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @Column()
  id_conductor: number;

  @ManyToOne(() => Conductor)
  @JoinColumn({ name: 'id_conductor' })
  conductor: Conductor;

  @Column()
  id_vehiculo: number;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'id_vehiculo' })
  vehiculo: Vehiculo;

  @Column({ length: 200, nullable: true })
  deposito: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ length: 50, default: 'pendiente' })
  estado: string;

  @Column({ type: 'date' })
  fecha_salida: Date;

  @Column()
  id_unidad: number;

  @ManyToOne(() => Unidad)
  @JoinColumn({ name: 'id_unidad' })
  unidad: Unidad;

  @Column()
  id_usuario_creador: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_creador' })
  usuario_creador: Usuario;

  @OneToMany(() => DetalleOrdenSalida, (detalle) => detalle.orden_salida, {
    cascade: true,
  })
  detalles: DetalleOrdenSalida[];

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
