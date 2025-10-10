import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemillerasService } from './semilleras.service';
import { SemillerasController } from './semilleras.controller';
import { Semillera } from './entities/semillera.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Semillera])],
  controllers: [SemillerasController],
  providers: [SemillerasService],
  exports: [SemillerasService],
})
export class SemillerasModule {}
