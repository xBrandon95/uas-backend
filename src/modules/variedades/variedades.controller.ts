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
import { VariedadesService } from './variedades.service';
import { CreateVariedadDto } from './dto/create-variedad.dto';
import { UpdateVariedadDto } from './dto/update-variedad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Variedad } from './entities/variedad.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('variedades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VariedadesController {
  constructor(private readonly variedadesService: VariedadesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO)
  create(@Body() createVariedadDto: CreateVariedadDto): Promise<Variedad> {
    return this.variedadesService.create(createVariedadDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.variedadesService.findAll(paginationDto);
  }

  @Get('activas')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Variedad[]> {
    return this.variedadesService.findAllActive();
  }

  @Get('semilla/:idSemilla')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findBySemilla(
    @Param('idSemilla', ParseIntPipe) idSemilla: number,
  ): Promise<Variedad[]> {
    return this.variedadesService.findBySemilla(idSemilla);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Variedad> {
    return this.variedadesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVariedadDto: UpdateVariedadDto,
  ): Promise<Variedad> {
    return this.variedadesService.update(id, updateVariedadDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.variedadesService.remove(id);
  }
}
