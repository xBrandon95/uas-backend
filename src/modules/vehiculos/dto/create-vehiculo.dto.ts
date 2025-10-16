import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  placa: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  marca_modelo?: string;
}
