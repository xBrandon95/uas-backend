import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenesIngresoService } from './ordenes-ingreso.service';
import { OrdenesIngresoController } from './ordenes-ingreso.controller';
import { OrdenIngreso } from './entities/orden-ingreso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrdenIngreso])],
  controllers: [OrdenesIngresoController],
  providers: [OrdenesIngresoService],
  exports: [OrdenesIngresoService],
})
export class OrdenesIngresoModule {}
