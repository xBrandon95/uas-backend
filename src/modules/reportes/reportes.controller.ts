import {
  Controller,
  Res,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { ReportesService } from './reportes.service';
import type { Response as ExpressResponse } from 'express';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('orden-ingreso/:id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  async generarReporteOrdenIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: ExpressResponse,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const buffer = await this.reportesService.generarOrdenIngresoPDF(id, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=orden-ingreso-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('orden-salida/:id')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  async generarReporteOrdenSalida(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: ExpressResponse,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const buffer = await this.reportesService.generarOrdenSalidaPDF(id, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=orden-salida-${id}.pdf`,
    });
    res.end(buffer);
  }

  @Get('inventario-consolidado')
  @Roles(Role.ADMIN, Role.ENCARGADO, Role.OPERADOR)
  async generarReporteInventarioConsolidado(
    @Res() res: ExpressResponse,
    @CurrentUser() user: AuthenticatedUser,
    @Query('idUnidad') idUnidad?: number,
    @Query('idSemilla') idSemilla?: number,
    @Query('idVariedad') idVariedad?: number,
    @Query('idCategoria') idCategoria?: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const buffer = await this.reportesService.generarInventarioConsolidadoPDF(
      user,
      {
        idUnidad,
        idSemilla,
        idVariedad,
        idCategoria,
        fechaInicio,
        fechaFin,
      },
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventario-consolidado-${timestamp}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${filename}`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
