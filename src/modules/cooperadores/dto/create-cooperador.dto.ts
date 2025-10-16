import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateCooperadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ci: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;
}
