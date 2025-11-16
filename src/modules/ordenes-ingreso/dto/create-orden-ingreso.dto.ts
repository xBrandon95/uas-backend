import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  IsDateString,
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
  @IsOptional()
  id_unidad: number;

  // Información de la semilla
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nro_lote_campo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nro_cupon: string;

  // Datos de ingreso/salida - OPCIONALES
  @IsString()
  @IsOptional()
  @MaxLength(200)
  lugar_ingreso?: string;

  @IsDateString()
  @IsOptional()
  hora_ingreso?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  lugar_salida?: string;

  @IsDateString()
  @IsOptional()
  hora_salida?: string;

  // Datos de pesaje
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  peso_bruto: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  peso_tara: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  peso_neto: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  peso_liquido: number;

  // Datos de laboratorio
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  porcentaje_humedad: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  porcentaje_impureza: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  peso_hectolitrico: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  porcentaje_grano_danado: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  porcentaje_grano_verde: number;

  // Observaciones
  @IsString()
  @IsOptional()
  observaciones?: string;

  // Estado - opcional porque tiene default en la entidad
  @IsString()
  @IsOptional()
  @MaxLength(50)
  estado?: string;
}
