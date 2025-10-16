import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateConductorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ci: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;
}
