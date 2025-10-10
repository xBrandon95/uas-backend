import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenesSalidaService } from './ordenes-salida.service';
import { OrdenesSalidaController } from './ordenes-salida.controller';
import { OrdenSalida } from './entities/orden-salida.entity';
import { DetalleOrdenSalida } from './entities/detalle-orden-salida.entity';
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenSalida, DetalleOrdenSalida, LoteProduccion]),
  ],
  controllers: [OrdenesSalidaController],
  providers: [OrdenesSalidaService],
  exports: [OrdenesSalidaService],
})
export class OrdenesSalidaModule {}
