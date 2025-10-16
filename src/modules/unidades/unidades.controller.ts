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
import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Unidad } from './entities/unidad.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('unidades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUnidadDto: CreateUnidadDto): Promise<Unidad> {
    return this.unidadesService.create(createUnidadDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.unidadesService.findAll(paginationDto);
  }

  @Get('activas')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Unidad[]> {
    return this.unidadesService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Unidad> {
    return this.unidadesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnidadDto: UpdateUnidadDto,
  ): Promise<Unidad> {
    return this.unidadesService.update(id, updateUnidadDto);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Unidad> {
    return this.unidadesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.unidadesService.remove(id);
  }
}
