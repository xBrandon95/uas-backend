import {
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleOrdenSalidaDto {
  @IsNumber()
  id_lote_produccion: number;

  @IsNumber()
  id_variedad: number;

  @IsNumber()
  id_categoria: number;

  @IsString()
  nro_lote: string;

  @IsString()
  @IsOptional()
  tamano?: string;

  @IsNumber()
  cantidad_unidades: number;

  @IsNumber()
  kg_por_unidad: number;
}

export class CreateOrdenSalidaDto {
  @IsNumber()
  id_semillera: number;

  @IsNumber()
  id_semilla: number;

  @IsNumber()
  id_cliente: number;

  @IsNumber()
  id_conductor: number;

  @IsNumber()
  id_vehiculo: number;

  @IsNumber()
  id_unidad: number;

  @IsDateString()
  fecha_salida: string;

  @IsString()
  @IsOptional()
  deposito?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsNumber()
  @IsOptional()
  total_costo_servicio?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenSalidaDto)
  detalles: CreateDetalleOrdenSalidaDto[];
}
