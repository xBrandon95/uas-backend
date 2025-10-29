import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenIngreso } from '../../ordenes-ingreso/entities/orden-ingreso.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Unidad } from '../../unidades/entities/unidad.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Variedad } from '../../variedades/entities/variedad.entity';

@Entity('lotes_produccion')
export class LoteProduccion {
  @PrimaryGeneratedColumn()
  id_lote_produccion: number;

  @Column()
  id_orden_ingreso: number;

  @ManyToOne(() => OrdenIngreso)
  @JoinColumn({ name: 'id_orden_ingreso' })
  orden_ingreso: OrdenIngreso;

  @Column()
  id_variedad: number;

  @ManyToOne(() => Variedad)
  @JoinColumn({ name: 'id_variedad' })
  variedad: Variedad;

  @Column()
  id_categoria_salida: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categoria_salida' })
  categoria_salida: Categoria;

  @Column({ unique: true, length: 50 })
  nro_lote: string;

  @Column({ type: 'int' })
  cantidad_unidades: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  kg_por_unidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_kg: number;

  @Column({ length: 100, nullable: true })
  presentacion: string;

  @Column({ length: 100, nullable: true })
  tipo_servicio: string;

  @Column({ length: 50, default: 'disponible' })
  estado: string;

  @Column({ type: 'date', nullable: true })
  fecha_produccion: Date;

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
}
