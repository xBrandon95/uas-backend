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
import { ConductoresService } from './conductores.service';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Conductor } from './entities/conductor.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('conductores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConductoresController {
  constructor(private readonly conductoresService: ConductoresService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(@Body() createConductorDto: CreateConductorDto): Promise<Conductor> {
    return this.conductoresService.create(createConductorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.conductoresService.findAll(paginationDto);
  }

  @Get('activos')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Conductor[]> {
    return this.conductoresService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Conductor> {
    return this.conductoresService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConductorDto: UpdateConductorDto,
  ): Promise<Conductor> {
    return this.conductoresService.update(id, updateConductorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.conductoresService.remove(id);
  }
}
