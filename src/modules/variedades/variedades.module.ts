import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariedadesService } from './variedades.service';
import { VariedadesController } from './variedades.controller';
import { Variedad } from './entities/variedad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Variedad])],
  controllers: [VariedadesController],
  providers: [VariedadesService],
  exports: [VariedadesService],
})
export class VariedadesModule {}
