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
import { OrdenesSalidaService } from './ordenes-salida.service';
import { CreateOrdenSalidaDto } from './dto/create-orden-salida.dto';
import { UpdateOrdenSalidaDto } from './dto/update-orden-salida.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdenSalida } from './entities/orden-salida.entity';
import { type AuthenticatedUser } from '../../common/interfaces/auth.interface';

@Controller('ordenes-salida')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesSalidaController {
  constructor(private readonly ordenesSalidaService: OrdenesSalidaService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  create(
    @Body() createOrdenSalidaDto: CreateOrdenSalidaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrdenSalida> {
    return this.ordenesSalidaService.create(
      createOrdenSalidaDto,
      user.id_usuario,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(): Promise<OrdenSalida[]> {
    return this.ordenesSalidaService.findAll();
  }

  @Get('estado/:estado')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByEstado(@Param('estado') estado: string): Promise<OrdenSalida[]> {
    return this.ordenesSalidaService.findByEstado(estado);
  }

  @Get('unidad/:idUnidad')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByUnidad(
    @Param('idUnidad', ParseIntPipe) idUnidad: number,
  ): Promise<OrdenSalida[]> {
    return this.ordenesSalidaService.findByUnidad(idUnidad);
  }

  @Get('cliente/:idCliente')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByCliente(
    @Param('idCliente', ParseIntPipe) idCliente: number,
  ): Promise<OrdenSalida[]> {
    return this.ordenesSalidaService.findByCliente(idCliente);
  }

  @Get('fecha')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByFecha(
    @Query('inicio') fechaInicio: string,
    @Query('fin') fechaFin: string,
  ): Promise<OrdenSalida[]> {
    return this.ordenesSalidaService.findByFecha(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('estadisticas')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  getEstadisticas(@Query('idUnidad') idUnidad?: number): Promise<any> {
    return this.ordenesSalidaService.getEstadisticas(idUnidad);
  }

  @Get('numero/:numeroOrden')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByNumeroOrden(
    @Param('numeroOrden') numeroOrden: string,
  ): Promise<OrdenSalida> {
    return this.ordenesSalidaService.findByNumeroOrden(numeroOrden);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrdenSalida> {
    return this.ordenesSalidaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrdenSalidaDto: UpdateOrdenSalidaDto,
  ): Promise<OrdenSalida> {
    return this.ordenesSalidaService.update(id, updateOrdenSalidaDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ): Promise<OrdenSalida> {
    return this.ordenesSalidaService.cambiarEstado(id, estado);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordenesSalidaService.remove(id);
  }
}
