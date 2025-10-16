import {
  IsString,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Role } from '../../../common/enums/roles.enum';

export class CreateUsuarioDto {
  @IsInt()
  @IsOptional()
  id_unidad?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  usuario: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  rol?: Role;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
