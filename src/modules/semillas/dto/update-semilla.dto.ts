import { PartialType } from '@nestjs/mapped-types';
import { CreateSemillaDto } from './create-semilla.dto';

export class UpdateSemillaDto extends PartialType(CreateSemillaDto) {}
