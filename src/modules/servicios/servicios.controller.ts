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
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Servicio } from './entities/servicio.entity';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('servicios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  create(@Body() createServicioDto: CreateServicioDto): Promise<Servicio> {
    return this.serviciosService.create(createServicioDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: Servicio[]; meta: any }> {
    return this.serviciosService.findAll(
      paginationDto.page,
      paginationDto.limit,
      paginationDto.search,
    );
  }

  @Get('activos')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAllActive(): Promise<Servicio[]> {
    return this.serviciosService.findAllActive();
  }

  @Get('estadisticas')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  getEstadisticas(): Promise<any> {
    return this.serviciosService.getEstadisticas();
  }

  @Get('nombre/:nombre')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByNombre(@Param('nombre') nombre: string): Promise<Servicio> {
    return this.serviciosService.findByNombre(nombre);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Servicio> {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicioDto: UpdateServicioDto,
  ): Promise<Servicio> {
    return this.serviciosService.update(id, updateServicioDto);
  }

  @Patch(':id/toggle-activo')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  toggleActivo(@Param('id', ParseIntPipe) id: number): Promise<Servicio> {
    return this.serviciosService.toggleActivo(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.serviciosService.remove(id);
  }
}
