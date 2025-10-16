import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CooperadoresService } from './cooperadores.service';
import { CreateCooperadorDto } from './dto/create-cooperador.dto';
import { UpdateCooperadorDto } from './dto/update-cooperador.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Cooperador } from './entities/cooperador.entity';
import { PaginationDto } from './dto/pagination.dto';

@Controller('cooperadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CooperadoresController {
  constructor(private readonly cooperadoresService: CooperadoresService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(
    @Body() createCooperadorDto: CreateCooperadorDto,
  ): Promise<Cooperador> {
    return this.cooperadoresService.create(createCooperadorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.cooperadoresService.findAll(paginationDto);
  }

  @Get('activos')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Cooperador[]> {
    return this.cooperadoresService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Cooperador> {
    return this.cooperadoresService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCooperadorDto: UpdateCooperadorDto,
  ): Promise<Cooperador> {
    return this.cooperadoresService.update(id, updateCooperadorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cooperadoresService.remove(id);
  }
}
