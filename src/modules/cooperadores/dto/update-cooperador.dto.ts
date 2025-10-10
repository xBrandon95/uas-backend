import { PartialType } from '@nestjs/mapped-types';
import { CreateCooperadorDto } from './create-cooperador.dto';

export class UpdateCooperadorDto extends PartialType(CreateCooperadorDto) {}
