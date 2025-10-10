import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemillasService } from './semillas.service';
import { SemillasController } from './semillas.controller';
import { Semilla } from './entities/semilla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Semilla])],
  controllers: [SemillasController],
  providers: [SemillasService],
  exports: [SemillasService],
})
export class SemillasModule {}
