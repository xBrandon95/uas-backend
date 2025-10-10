import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateSemilleraDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nit?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
