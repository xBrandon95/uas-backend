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
import { LotesProduccionService } from './lotes-produccion.service';
import { CreateLoteProduccionDto } from './dto/create-lote-produccion.dto';
import { UpdateLoteProduccionDto } from './dto/update-lote-produccion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoteProduccion } from './entities/lote-produccion.entity';
import { type AuthenticatedUser } from 'src/common/interfaces/auth.interface';
import { PaginationDto } from '../cooperadores/dto/pagination.dto';

@Controller('lotes-produccion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LotesProduccionController {
  constructor(
    private readonly lotesProduccionService: LotesProduccionService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  create(
    @Body() createLoteProduccionDto: CreateLoteProduccionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoteProduccion> {
    return this.lotesProduccionService.create(
      createLoteProduccionDto,
      user.id_usuario,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: LoteProduccion[]; meta: any }> {
    return this.lotesProduccionService.findAll(
      paginationDto.page,
      paginationDto.limit,
      paginationDto.search,
      user.rol,
      user.id_unidad,
    );
  }

  @Get('disponibles')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findDisponibles(): Promise<LoteProduccion[]> {
    return this.lotesProduccionService.findDisponibles();
  }

  @Get('estado/:estado')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByEstado(@Param('estado') estado: string): Promise<LoteProduccion[]> {
    return this.lotesProduccionService.findByEstado(estado);
  }

  @Get('unidad/:idUnidad')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByUnidad(
    @Param('idUnidad', ParseIntPipe) idUnidad: number,
  ): Promise<LoteProduccion[]> {
    return this.lotesProduccionService.findByUnidad(idUnidad);
  }

  @Get('variedad/:idVariedad')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByVariedad(
    @Param('idVariedad', ParseIntPipe) idVariedad: number,
  ): Promise<LoteProduccion[]> {
    return this.lotesProduccionService.findByVariedad(idVariedad);
  }

  @Get('orden-ingreso/:idOrdenIngreso')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByOrdenIngreso(
    @Param('idOrdenIngreso', ParseIntPipe) idOrdenIngreso: number,
  ): Promise<LoteProduccion[]> {
    return this.lotesProduccionService.findByOrdenIngreso(idOrdenIngreso);
  }

  @Get('inventario')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  getInventarioPorVariedad(
    @CurrentUser() user: AuthenticatedUser,
    @Query('idUnidad') idUnidad?: number,
    @Query('idSemilla') idSemilla?: number,
    @Query('idVariedad') idVariedad?: number,
    @Query('idCategoria') idCategoria?: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<any[]> {
    return this.lotesProduccionService.getInventarioPorVariedad(
      user.rol,
      user.id_unidad,
      idUnidad,
      idSemilla,
      idVariedad,
      idCategoria,
      fechaInicio,
      fechaFin,
    );
  }

  @Get('estadisticas')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  getEstadisticas(@Query('idUnidad') idUnidad?: number): Promise<any> {
    return this.lotesProduccionService.getEstadisticas(idUnidad);
  }

  @Get('numero/:numeroLote')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findByNumeroLote(
    @Param('numeroLote') numeroLote: string,
  ): Promise<LoteProduccion> {
    return this.lotesProduccionService.findByNumeroLote(numeroLote);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LoteProduccion> {
    return this.lotesProduccionService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoteProduccionDto: UpdateLoteProduccionDto,
  ): Promise<LoteProduccion> {
    return this.lotesProduccionService.update(id, updateLoteProduccionDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ): Promise<LoteProduccion> {
    return this.lotesProduccionService.cambiarEstado(id, estado);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ENCARGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.lotesProduccionService.remove(id);
  }
}
