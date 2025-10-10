import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdenSalidaDto } from './create-orden-salida.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateOrdenSalidaDto extends PartialType(
  OmitType(CreateOrdenSalidaDto, ['detalles'] as const),
) {}
