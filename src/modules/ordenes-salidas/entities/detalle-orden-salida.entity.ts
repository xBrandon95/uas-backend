import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenSalida } from './orden-salida.entity';
import { LoteProduccion } from '../../lotes-produccion/entities/lote-produccion.entity';
import { Variedad } from '../../variedades/entities/variedad.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';

@Entity('detalle_ordenes_salida')
export class DetalleOrdenSalida {
  @PrimaryGeneratedColumn()
  id_detalle_salida: number;

  @Column()
  id_orden_salida: number;

  @ManyToOne(() => OrdenSalida, (orden) => orden.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_orden_salida' })
  orden_salida: OrdenSalida;

  @Column()
  id_lote_produccion: number;

  @ManyToOne(() => LoteProduccion)
  @JoinColumn({ name: 'id_lote_produccion' })
  lote_produccion: LoteProduccion;

  @Column()
  id_variedad: number;

  @ManyToOne(() => Variedad)
  @JoinColumn({ name: 'id_variedad' })
  variedad: Variedad;

  @Column()
  id_categoria: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categoria' })
  categoria: Categoria;

  @Column({ length: 50 })
  nro_lote: string;

  @Column({ length: 100, nullable: true })
  tamano: string;

  @Column({ type: 'int' })
  cantidad_unidades: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  kg_por_unidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_kg: number;

  @CreateDateColumn()
  fecha_creacion: Date;
}
