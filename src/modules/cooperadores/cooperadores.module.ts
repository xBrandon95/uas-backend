import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CooperadoresService } from './cooperadores.service';
import { CooperadoresController } from './cooperadores.controller';
import { Cooperador } from './entities/cooperador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cooperador])],
  controllers: [CooperadoresController],
  providers: [CooperadoresService],
  exports: [CooperadoresService],
})
export class CooperadoresModule {}
