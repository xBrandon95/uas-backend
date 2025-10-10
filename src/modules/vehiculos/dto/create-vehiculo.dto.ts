import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  placa: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  tipo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  marca?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  modelo?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
