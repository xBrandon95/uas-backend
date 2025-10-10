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
import { OrdenesIngresoService } from './ordenes-ingreso.service';
import { CreateOrdenIngresoDto } from './dto/create-orden-ingreso.dto';
import { UpdateOrdenIngresoDto } from './dto/update-orden-ingreso.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { OrdenIngreso } from './entities/orden-ingreso.entity';

@Controller('ordenes-ingreso')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesIngresoController {
  constructor(private readonly ordenesIngresoService: OrdenesIngresoService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  create(
    @Body() createOrdenIngresoDto: CreateOrdenIngresoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrdenIngreso> {
    return this.ordenesIngresoService.create(
      createOrdenIngresoDto,
      user.id_usuario,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(): Promise<OrdenIngreso[]> {
    return this.ordenesIngresoService.findAll();
  }

  @Get('estado/:estado')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByEstado(@Param('estado') estado: string): Promise<OrdenIngreso[]> {
    return this.ordenesIngresoService.findByEstado(estado);
  }

  @Get('unidad/:idUnidad')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByUnidad(
    @Param('idUnidad', ParseIntPipe) idUnidad: number,
  ): Promise<OrdenIngreso[]> {
    return this.ordenesIngresoService.findByUnidad(idUnidad);
  }

  @Get('fecha')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByFecha(
    @Query('inicio') fechaInicio: string,
    @Query('fin') fechaFin: string,
  ): Promise<OrdenIngreso[]> {
    return this.ordenesIngresoService.findByFecha(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('estadisticas')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  getEstadisticas(@Query('idUnidad') idUnidad?: number): Promise<any> {
    return this.ordenesIngresoService.getEstadisticas(idUnidad);
  }

  @Get('numero/:numeroOrden')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByNumeroOrden(
    @Param('numeroOrden') numeroOrden: string,
  ): Promise<OrdenIngreso> {
    return this.ordenesIngresoService.findByNumeroOrden(numeroOrden);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrdenIngreso> {
    return this.ordenesIngresoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrdenIngresoDto: UpdateOrdenIngresoDto,
  ): Promise<OrdenIngreso> {
    return this.ordenesIngresoService.update(id, updateOrdenIngresoDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ): Promise<OrdenIngreso> {
    return this.ordenesIngresoService.cambiarEstado(id, estado);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordenesIngresoService.remove(id);
  }
}
