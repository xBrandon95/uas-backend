import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MovimientosLoteService } from './movimientos-lote.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';

@Controller('movimientos-lote')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimientosLoteController {
  constructor(private readonly movimientosService: MovimientosLoteService) {}

  @Get('lote/:idLote')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  getHistorialByLote(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.movimientosService.getHistorialByLote(idLote);
  }

  @Get('lote/:idLote/resumen')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  getResumenMovimientos(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.movimientosService.getResumenMovimientos(idLote);
  }

  @Get('orden-salida/:idOrden')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  getMovimientosByOrdenSalida(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.movimientosService.getMovimientosByOrdenSalida(idOrden);
  }
}
