import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoteProduccion } from '../../lotes-produccion/entities/lote-produccion.entity';
import { OrdenSalida } from '../../ordenes-salidas/entities/orden-salida.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('movimientos_lote')
export class MovimientoLote {
  @PrimaryGeneratedColumn()
  id_movimiento: number;

  @Column()
  id_lote_produccion: number;

  @ManyToOne(() => LoteProduccion)
  @JoinColumn({ name: 'id_lote_produccion' })
  lote_produccion: LoteProduccion;

  @Column({
    type: 'enum',
    enum: ['entrada', 'salida', 'ajuste', 'merma'],
    default: 'entrada',
  })
  tipo_movimiento: string;

  @Column({ type: 'int' })
  cantidad_unidades: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  kg_movidos: number;

  @Column({ type: 'int' })
  saldo_unidades: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  saldo_kg: number;

  @Column({ nullable: true })
  id_orden_salida?: number;

  @ManyToOne(() => OrdenSalida, { nullable: true })
  @JoinColumn({ name: 'id_orden_salida' })
  orden_salida?: OrdenSalida;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column()
  id_usuario: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @CreateDateColumn()
  fecha_movimiento: Date;
}
