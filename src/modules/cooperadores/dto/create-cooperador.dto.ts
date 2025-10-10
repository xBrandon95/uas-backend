import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateCooperadorDto {
  @IsInt()
  @IsNotEmpty()
  id_semillera: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  ci?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  direccion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
