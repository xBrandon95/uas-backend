import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoLote } from './entities/movimiento-lote.entity';
import { MovimientosLoteService } from './movimientos-lote.service';
import { MovimientosLoteController } from './movimientos-lote.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoLote])],
  controllers: [MovimientosLoteController],
  providers: [MovimientosLoteService],
  exports: [MovimientosLoteService, TypeOrmModule],
})
export class MovimientosLoteModule {}
