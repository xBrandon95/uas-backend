import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdenIngresoDto } from './create-orden-ingreso.dto';

export class UpdateOrdenIngresoDto extends PartialType(CreateOrdenIngresoDto) {}
