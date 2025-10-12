import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../../common/enums/roles.enum';
import { Unidad } from 'src/modules/unidades/entities/unidad.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ nullable: true })
  id_unidad: number;

  @ManyToOne(() => Unidad, { nullable: true })
  @JoinColumn({ name: 'id_unidad' })
  unidad: Unidad;

  @Column({ length: 100 })
  nombre: string;

  @Column({ unique: true, length: 50 })
  usuario: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.OPERADOR,
  })
  rol: Role;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  // Hash password antes de insertar
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Método para comparar contraseñas
  async comparePassword(attempt: string): Promise<boolean> {
    return await bcrypt.compare(attempt, this.password);
  }
}
