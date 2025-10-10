import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotesProduccionService } from './lotes-produccion.service';
import { LotesProduccionController } from './lotes-produccion.controller';
import { LoteProduccion } from './entities/lote-produccion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoteProduccion])],
  controllers: [LotesProduccionController],
  providers: [LotesProduccionService],
  exports: [LotesProduccionService],
})
export class LotesProduccionModule {}
