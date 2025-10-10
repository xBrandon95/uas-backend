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
} from '@nestjs/common';
import { CooperadoresService } from './cooperadores.service';
import { CreateCooperadorDto } from './dto/create-cooperador.dto';
import { UpdateCooperadorDto } from './dto/update-cooperador.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Cooperador } from './entities/cooperador.entity';

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
  findAll(): Promise<Cooperador[]> {
    return this.cooperadoresService.findAll();
  }

  @Get('activos')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Cooperador[]> {
    return this.cooperadoresService.findAllActive();
  }

  @Get('semillera/:idSemillera')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findBySemillera(
    @Param('idSemillera', ParseIntPipe) idSemillera: number,
  ): Promise<Cooperador[]> {
    return this.cooperadoresService.findBySemillera(idSemillera);
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

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Cooperador> {
    return this.cooperadoresService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cooperadoresService.remove(id);
  }
}
