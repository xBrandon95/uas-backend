import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  // IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateOrdenIngresoDto {
  // Relaciones obligatorias
  @IsInt()
  @IsNotEmpty()
  id_semillera: number;

  @IsInt()
  @IsNotEmpty()
  id_cooperador: number;

  @IsInt()
  @IsNotEmpty()
  id_conductor: number;

  @IsInt()
  @IsNotEmpty()
  id_vehiculo: number;

  @IsInt()
  @IsNotEmpty()
  id_semilla: number;

  @IsInt()
  @IsNotEmpty()
  id_variedad: number;

  @IsInt()
  @IsNotEmpty()
  id_categoria_ingreso: number;

  @IsInt()
  @IsNotEmpty()
  id_unidad: number;

  // Información de la semilla
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nro_lote_campo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nro_cupon?: string;

  // Datos de ingreso/salida
  @IsString()
  @IsOptional()
  @MaxLength(200)
  lugar_ingreso?: string;

  @IsString()
  @IsOptional()
  hora_ingreso?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  lugar_salida?: string;

  @IsString()
  @IsOptional()
  hora_salida?: string;

  // Datos de pesaje
  @IsNumber()
  @IsOptional()
  @Min(0)
  peso_bruto?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  peso_tara?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  peso_neto?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  peso_liquido?: number;

  // Datos de laboratorio
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  porcentaje_humedad?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  porcentaje_impureza?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  peso_hectolitrico?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  porcentaje_grano_danado?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  porcentaje_grano_verde?: number;

  // Observaciones
  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}
