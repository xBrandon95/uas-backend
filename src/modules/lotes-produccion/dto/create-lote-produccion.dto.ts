import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoteProduccionDto {
  @IsInt()
  @IsNotEmpty()
  id_orden_ingreso: number;

  @IsInt()
  @IsNotEmpty()
  id_variedad: number;

  @IsInt()
  @IsNotEmpty()
  id_categoria_salida: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  cantidad_unidades: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  kg_por_unidad: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  presentacion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  tipo_servicio?: string;

  @IsString()
  @IsOptional()
  fecha_produccion?: string;

  @IsInt()
  @IsNotEmpty()
  id_unidad: number;

  @IsString()
  @IsOptional()
  estado?: string;
}
