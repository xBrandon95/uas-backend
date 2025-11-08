import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { OrdenSalida } from '../ordenes-salidas/entities/orden-salida.entity';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { Role } from '../../common/enums/roles.enum';
import { PdfConfig } from './pdf.config';
import { PdfBuilderIngreso } from './pdf-builder-ingreso';
import { PdfBuilderSalida } from './pdf-builder-salida';

@Injectable()
export class ReportesService {
  private printer: PdfPrinter;

  constructor(
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
    @InjectRepository(OrdenSalida)
    private readonly ordenSalidaRepository: Repository<OrdenSalida>,
  ) {
    this.printer = new PdfPrinter(PdfConfig.getFonts());
  }

  async generarOrdenIngresoPDF(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Buffer> {
    const orden = await this.ordenIngresoRepository.findOne({
      where: { id_orden_ingreso: id },
      relations: [
        'semillera',
        'cooperador',
        'conductor',
        'vehiculo',
        'semilla',
        'variedad',
        'categoria_ingreso',
        'unidad',
        'usuario_creador',
      ],
    });

    this.validateOrden(orden, id, user, 'ingreso');
    return this.generatePDF(PdfBuilderIngreso.build(orden!));
  }

  async generarOrdenSalidaPDF(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Buffer> {
    const orden = await this.ordenSalidaRepository.findOne({
      where: { id_orden_salida: id },
      relations: [
        'semillera',
        'semilla',
        'cliente',
        'conductor',
        'vehiculo',
        'unidad',
        'usuario_creador',
        'detalles',
        'detalles.variedad',
        'detalles.categoria',
        'detalles.lote_produccion',
      ],
    });

    this.validateOrden(orden, id, user, 'salida');
    return this.generatePDF(PdfBuilderSalida.build(orden!));
  }

  private validateOrden(
    orden: OrdenIngreso | OrdenSalida | null,
    id: number,
    user: AuthenticatedUser,
    tipo: 'ingreso' | 'salida',
  ): asserts orden is OrdenIngreso | OrdenSalida {
    if (!orden) {
      throw new NotFoundException(
        `Orden de ${tipo} con ID ${id} no encontrada`,
      );
    }

    if (
      user.rol !== Role.ADMIN &&
      user.id_unidad &&
      orden.id_unidad !== user.id_unidad
    ) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }
  }

  private generatePDF(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
