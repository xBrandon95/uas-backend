import { PartialType } from '@nestjs/mapped-types';
import { CreateSemilleraDto } from './create-semillera.dto';

export class UpdateSemilleraDto extends PartialType(CreateSemilleraDto) {}
