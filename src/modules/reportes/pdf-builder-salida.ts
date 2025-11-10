import { TDocumentDefinitions, Content, Margins } from 'pdfmake/interfaces';
import { OrdenSalida } from '../ordenes-salidas/entities/orden-salida.entity';
import { PdfConfig } from './pdf.config';
import { PdfUtils } from './pdf.utils';

export class PdfBuilderSalida {
  static build(orden: OrdenSalida): TDocumentDefinitions {
    const logos = PdfConfig.getLogos();
    const styles = PdfConfig.getCommonStyles();
    const pageConfig = PdfConfig.getPageConfig();

    const content: Content[] = [
      ...PdfUtils.buildHeader(
        logos,
        orden.numero_orden,
        orden.unidad?.nombre,
        'ORDEN DE SALIDA DE SEMILLA',
        new Date(orden.fecha_creacion),
      ),

      // Datos generales
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: [
                  { text: 'SEMILLERA: ', bold: true },
                  { text: orden.semillera?.nombre || 'N/A' },
                ],
                style: 'field',
              },
            ],
            [
              {
                text: [
                  { text: 'CLIENTE: ', bold: true },
                  { text: orden.cliente?.nombre || 'N/A' },
                ],
                style: 'field',
              },
            ],
            ...PdfUtils.buildVehicleDriverInfo(orden.conductor, orden.vehiculo),
            [
              {
                columns: [
                  {
                    text: [
                      { text: 'PRODUCTO: ', bold: true },
                      { text: orden.semilla?.nombre || 'N/A' },
                    ],
                    style: 'field',
                  },
                  {
                    text: [
                      { text: 'DEPÓSITO: ', bold: true },
                      { text: orden.deposito || 'N/A' },
                    ],
                    style: 'field',
                  },
                ],
              },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 5],
      },

      // Tabla de detalles
      this.buildDetallesTable(orden),

      { text: '\n' },

      // Observaciones
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: [
                  { text: 'OBSERVACIONES: ', bold: true },
                  { text: orden.observaciones || 'N/A' },
                ],
                style: 'field',
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10] as Margins,
      },
      {
        text: orden.total_costo_servicio
          ? `Total costo servicio: Bs. ${Number(
              orden.total_costo_servicio,
            ).toFixed(2)}`
          : 'Total costo servicio: ',
        bold: true,
        alignment: 'right',
        style: 'field',
        margin: [0, 15, 60, 15],
      },

      // Firmas
      {
        text: 'AUTORIZADO POR: ',
        style: 'field',
        margin: [0, 5, 0, 30],
      },
      PdfUtils.buildSignatures(),
    ];

    return {
      ...pageConfig,
      styles,
      content,
      footer: [
        {
          text: 'Nota: Nuestra responsabilidad cesa al momento que firma y sale de nuestras instalaciones.',
          alignment: 'center',
          fontSize: 7,
        },
      ],
    };
  }

  private static buildDetallesTable(orden: OrdenSalida): Content {
    const detallesTableBody = [
      [
        { text: 'Lote', style: 'title' },
        { text: 'Variedad', style: 'title' },
        { text: 'Categoría', style: 'title' },
        { text: 'Unidades', style: 'title' },
        { text: 'Kg/u', style: 'title' },
        { text: 'Total Kg', style: 'title' },
      ],
      ...orden.detalles.map((detalle) => [
        { text: detalle.nro_lote, style: 'small' },
        { text: detalle.variedad?.nombre || 'N/A', style: 'small' },
        { text: detalle.categoria?.nombre || 'N/A', style: 'small' },
        { text: detalle.cantidad_unidades.toString(), style: 'small' },
        {
          text: PdfUtils.formatNumber(detalle.kg_por_unidad, 2),
          style: 'small',
        },
        { text: PdfUtils.formatNumber(detalle.total_kg, 2), style: 'small' },
      ]),
    ];

    return {
      table: {
        widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
        body: detallesTableBody,
      },
    };
  }
}
