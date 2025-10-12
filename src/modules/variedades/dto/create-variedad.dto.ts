import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateVariedadDto {
  @IsInt()
  @IsNotEmpty()
  id_semilla: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
