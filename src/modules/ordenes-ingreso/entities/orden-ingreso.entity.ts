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
import { Cooperador } from '../../cooperadores/entities/cooperador.entity';
import { Conductor } from '../../conductores/entities/conductor.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Semilla } from '../../semillas/entities/semilla.entity';
import { Variedad } from '../../variedades/entities/variedad.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Unidad } from '../../unidades/entities/unidad.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { LoteProduccion } from 'src/modules/lotes-produccion/entities/lote-produccion.entity';

@Entity('ordenes_ingreso')
export class OrdenIngreso {
  @PrimaryGeneratedColumn()
  id_orden_ingreso: number;

  @Column({ unique: true, length: 50 })
  numero_orden: string;

  // Relaciones de transporte
  @Column()
  id_semillera: number;

  @ManyToOne(() => Semillera)
  @JoinColumn({ name: 'id_semillera' })
  semillera: Semillera;

  @Column()
  id_cooperador: number;

  @ManyToOne(() => Cooperador)
  @JoinColumn({ name: 'id_cooperador' })
  cooperador: Cooperador;

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

  // Información de la semilla
  @Column()
  id_semilla: number;

  @ManyToOne(() => Semilla)
  @JoinColumn({ name: 'id_semilla' })
  semilla: Semilla;

  @Column()
  id_variedad: number;

  @ManyToOne(() => Variedad)
  @JoinColumn({ name: 'id_variedad' })
  variedad: Variedad;

  @Column()
  id_categoria_ingreso: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categoria_ingreso' })
  categoria_ingreso: Categoria;

  @Column({ length: 100 })
  nro_lote_campo: string;

  @Column({ length: 100 })
  nro_cupon: string;

  // Datos de ingreso/salida
  @Column({ length: 200, nullable: true })
  lugar_ingreso: string;

  @Column({ type: 'datetime', nullable: true })
  hora_ingreso: Date;

  @Column({ length: 200, nullable: true })
  lugar_salida: string;

  @Column({ type: 'datetime', nullable: true })
  hora_salida: Date;

  // Datos de pesaje
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_bruto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_tara: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_neto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_liquido: number;

  // Datos de laboratorio
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje_humedad: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje_impureza: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peso_hectolitrico: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje_grano_danado: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje_grano_verde: number;

  // Observaciones
  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // Estado y tracking
  @Column({ length: 50, default: 'pendiente' })
  estado: string;

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

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToMany(() => LoteProduccion, (lote) => lote.orden_ingreso)
  lotes_produccion: LoteProduccion[];
}
