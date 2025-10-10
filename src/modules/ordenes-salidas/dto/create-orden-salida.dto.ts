import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleOrdenSalidaDto {
  @IsInt()
  @IsNotEmpty()
  id_lote_produccion: number;

  @IsInt()
  @IsNotEmpty()
  id_variedad: number;

  @IsInt()
  @IsNotEmpty()
  id_categoria: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nro_lote: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  tamano?: string;

  @IsInt()
  @IsNotEmpty()
  nro_bolsas: number;

  @IsInt()
  @IsNotEmpty()
  kg_bolsa: number;
}

export class CreateOrdenSalidaDto {
  @IsInt()
  @IsNotEmpty()
  id_semillera: number;

  @IsInt()
  @IsNotEmpty()
  id_cliente: number;

  @IsInt()
  @IsNotEmpty()
  id_conductor: number;

  @IsInt()
  @IsNotEmpty()
  id_vehiculo: number;

  @IsInt()
  @IsNotEmpty()
  id_unidad: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  deposito?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsNotEmpty()
  fecha_salida: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateDetalleOrdenSalidaDto)
  detalles: CreateDetalleOrdenSalidaDto[];
}
