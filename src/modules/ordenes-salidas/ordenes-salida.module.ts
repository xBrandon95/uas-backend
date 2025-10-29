import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenesSalidaService } from './ordenes-salida.service';
import { OrdenesSalidaController } from './ordenes-salida.controller';
import { OrdenSalida } from './entities/orden-salida.entity';
import { DetalleOrdenSalida } from './entities/detalle-orden-salida.entity';
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';
import { MovimientoLote } from '../movimientos-lote/entities/movimiento-lote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenSalida,
      DetalleOrdenSalida,
      LoteProduccion,
      MovimientoLote,
    ]),
  ],
  controllers: [OrdenesSalidaController],
  providers: [OrdenesSalidaService],
  exports: [OrdenesSalidaService],
})
export class OrdenesSalidaModule {}
