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
import { LoteProduccion } from '../lotes-produccion/entities/lote-produccion.entity';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { Role } from '../../common/enums/roles.enum';
import { PdfConfig } from './pdf.config';
import { PdfBuilderIngreso } from './pdf-builder-ingreso';
import { PdfBuilderSalida } from './pdf-builder-salida';
import { PdfBuilderInventario } from './pdf-builder-inventario';

interface FiltrosInventario {
  idUnidad?: number;
  idSemilla?: number;
  idVariedad?: number;
  idCategoria?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

@Injectable()
export class ReportesService {
  private printer: PdfPrinter;

  constructor(
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
    @InjectRepository(OrdenSalida)
    private readonly ordenSalidaRepository: Repository<OrdenSalida>,
    @InjectRepository(LoteProduccion)
    private readonly loteProduccionRepository: Repository<LoteProduccion>,
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

  async generarInventarioConsolidadoPDF(
    user: AuthenticatedUser,
    filtros: FiltrosInventario,
  ): Promise<Buffer> {
    const queryBuilder = this.loteProduccionRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.variedad', 'variedad')
      .leftJoin('variedad.semilla', 'semilla')
      .leftJoin('lote.categoria_salida', 'categoria')
      .leftJoin('lote.unidad', 'unidad')
      .select('variedad.nombre', 'variedad')
      .addSelect('semilla.nombre', 'semilla')
      .addSelect('categoria.nombre', 'categoria')
      .addSelect('SUM(lote.cantidad_unidades)', 'total_unidades')
      .addSelect('SUM(lote.total_kg)', 'total_kg')
      .where('lote.estado IN (:...estados)', {
        estados: ['disponible', 'parcialmente_vendido'],
      });

    // Filtro por rol y unidad
    if (user.rol !== Role.ADMIN) {
      if (!user.id_unidad) {
        throw new ForbiddenException('No se encontró la unidad del usuario');
      }
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: user.id_unidad,
      });
    } else if (filtros.idUnidad) {
      queryBuilder.andWhere('lote.id_unidad = :idUnidad', {
        idUnidad: filtros.idUnidad,
      });
    }

    // Filtros opcionales
    if (filtros.idSemilla) {
      queryBuilder.andWhere('semilla.id_semilla = :idSemilla', {
        idSemilla: filtros.idSemilla,
      });
    }

    if (filtros.idVariedad) {
      queryBuilder.andWhere('variedad.id_variedad = :idVariedad', {
        idVariedad: filtros.idVariedad,
      });
    }

    if (filtros.idCategoria) {
      queryBuilder.andWhere('categoria.id_categoria = :idCategoria', {
        idCategoria: filtros.idCategoria,
      });
    }

    if (filtros.fechaInicio && filtros.fechaFin) {
      queryBuilder.andWhere(
        'DATE(lote.fecha_creacion) BETWEEN :fechaInicio AND :fechaFin',
        {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
        },
      );
    } else if (filtros.fechaInicio) {
      queryBuilder.andWhere('DATE(lote.fecha_creacion) >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    } else if (filtros.fechaFin) {
      queryBuilder.andWhere('DATE(lote.fecha_creacion) <= :fechaFin', {
        fechaFin: filtros.fechaFin,
      });
    }

    queryBuilder
      .groupBy('variedad.id_variedad')
      .addGroupBy('semilla.nombre')
      .addGroupBy('categoria.id_categoria')
      .orderBy('semilla.nombre', 'ASC')
      .addOrderBy('variedad.nombre', 'ASC')
      .addOrderBy('categoria.nombre', 'ASC');

    const inventario = await queryBuilder.getRawMany();

    if (!inventario || inventario.length === 0) {
      throw new NotFoundException(
        'No se encontró inventario con los filtros aplicados',
      );
    }

    // Obtener nombres para los filtros (para mostrar en el PDF)
    const filtrosNombres: any = {};

    if (filtros.idUnidad) {
      const unidad = await this.loteProduccionRepository
        .createQueryBuilder('lote')
        .leftJoin('lote.unidad', 'unidad')
        .select('unidad.nombre', 'nombre')
        .where('lote.id_unidad = :idUnidad', { idUnidad: filtros.idUnidad })
        .getRawOne();
      if (unidad) filtrosNombres.unidadNombre = unidad.nombre;
    }

    if (filtros.idSemilla) {
      const semilla = await this.loteProduccionRepository
        .createQueryBuilder('lote')
        .leftJoin('lote.variedad', 'variedad')
        .leftJoin('variedad.semilla', 'semilla')
        .select('semilla.nombre', 'nombre')
        .where('semilla.id_semilla = :idSemilla', {
          idSemilla: filtros.idSemilla,
        })
        .getRawOne();
      if (semilla) filtrosNombres.semillaNombre = semilla.nombre;
    }

    if (filtros.idVariedad) {
      const variedad = await this.loteProduccionRepository
        .createQueryBuilder('lote')
        .leftJoin('lote.variedad', 'variedad')
        .select('variedad.nombre', 'nombre')
        .where('variedad.id_variedad = :idVariedad', {
          idVariedad: filtros.idVariedad,
        })
        .getRawOne();
      if (variedad) filtrosNombres.variedadNombre = variedad.nombre;
    }

    if (filtros.idCategoria) {
      const categoria = await this.loteProduccionRepository
        .createQueryBuilder('lote')
        .leftJoin('lote.categoria_salida', 'categoria')
        .select('categoria.nombre', 'nombre')
        .where('categoria.id_categoria = :idCategoria', {
          idCategoria: filtros.idCategoria,
        })
        .getRawOne();
      if (categoria) filtrosNombres.categoriaNombre = categoria.nombre;
    }

    if (filtros.fechaInicio) {
      filtrosNombres.fechaInicio = filtros.fechaInicio;
    }

    if (filtros.fechaFin) {
      filtrosNombres.fechaFin = filtros.fechaFin;
    }

    const docDefinition = PdfBuilderInventario.build(
      inventario,
      filtrosNombres,
    );
    return this.generatePDF(docDefinition);
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
