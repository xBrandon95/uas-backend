import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { Unidad } from '../unidades/entities/unidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Unidad])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService], // Exportar para usar en AuthModule
})
export class UsuariosModule {}
