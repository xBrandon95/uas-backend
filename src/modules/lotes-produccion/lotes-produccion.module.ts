import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotesProduccionService } from './lotes-produccion.service';
import { LotesProduccionController } from './lotes-produccion.controller';
import { LoteProduccion } from './entities/lote-produccion.entity';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { MovimientoLote } from '../movimientos-lote/entities/movimiento-lote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoteProduccion, OrdenIngreso, MovimientoLote]),
  ],
  controllers: [LotesProduccionController],
  providers: [LotesProduccionService],
  exports: [LotesProduccionService],
})
export class LotesProduccionModule {}
