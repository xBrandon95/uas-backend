import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { OrdenSalida } from '../ordenes-salidas/entities/orden-salida.entity';
import { DetalleOrdenSalida } from '../ordenes-salidas/entities/detalle-orden-salida.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenIngreso, OrdenSalida, DetalleOrdenSalida]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService, ReportesModule],
})
export class ReportesModule {}
