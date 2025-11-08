import { TDocumentDefinitions, Content, Margins } from 'pdfmake/interfaces';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { PdfConfig } from './pdf.config';
import { PdfUtils } from './pdf.utils';

export class PdfBuilderIngreso {
  static build(orden: OrdenIngreso): TDocumentDefinitions {
    const logos = PdfConfig.getLogos();
    const styles = PdfConfig.getCommonStyles();
    const pageConfig = PdfConfig.getPageConfig();

    const content: Content[] = [
      ...PdfUtils.buildHeader(
        logos,
        orden.numero_orden,
        orden.unidad?.nombre,
        'ORDEN DE INGRESO DE SEMILLA',
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
                  { text: 'COOPERADOR: ', bold: true },
                  { text: orden.cooperador?.nombre || 'N/A' },
                ],
                style: 'field',
              },
            ],
            ...PdfUtils.buildVehicleDriverInfo(orden.conductor, orden.vehiculo),
          ],
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 5],
      },

      // Producto
      {
        table: {
          widths: ['*', '*', '*', '*', '*', '*'],
          body: [
            [
              {
                text: [
                  { text: 'PRODUCTO: ', bold: true },
                  { text: orden.semilla?.nombre || 'N/A' },
                ],
                style: 'field',
                colSpan: 2,
              },
              {},
              {
                text: [
                  { text: 'VARIEDAD: ', bold: true },
                  { text: orden.variedad?.nombre || 'N/A' },
                ],
                style: 'field',
                colSpan: 2,
              },
              {},
              {
                text: [
                  { text: 'CATEGORÍA: ', bold: true },
                  { text: orden.categoria_ingreso?.nombre || 'N/A' },
                ],
                style: 'field',
                colSpan: 2,
              },
              {},
            ],
            [
              {
                text: [
                  { text: 'N° DE LOTE: ', bold: true },
                  { text: orden.nro_lote_campo || 'N/A' },
                ],
                style: 'field',
                colSpan: 3,
              },
              {},
              {},
              {
                text: [
                  { text: 'N° CUPÓN: ', bold: true },
                  { text: orden.nro_cupon || 'N/A' },
                ],
                style: 'field',
                colSpan: 3,
              },
              {},
              {},
            ],
          ],
        },
        margin: [0, 5, 0, 5],
      },

      // Pesaje y descripción
      this.buildPesajeTable(orden),
    ];

    // Observaciones (si existen)
    if (orden.observaciones) {
      content.push({
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: [
                  { text: 'OBSERVACIONES: ', bold: true },
                  { text: orden.observaciones },
                ],
                style: 'field',
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10] as Margins,
      });
    }

    // Firmas
    content.push(
      {
        text: 'AUTORIZADO POR: ',
        style: 'field',
        margin: [0, 5, 0, 30],
      },
      PdfUtils.buildSignatures(),
    );

    return {
      ...pageConfig,
      styles,
      content,
    };
  }

  private static buildPesajeTable(orden: OrdenIngreso): Content {
    return {
      table: {
        widths: ['*', '*'],
        body: [
          [
            { text: 'DATOS DE PESAJE', style: 'subHeader' },
            { text: 'DESCRIPCIÓN', style: 'subHeader' },
          ],
          [
            {
              stack: [
                {
                  text: [
                    { text: 'PESO BRUTO: ', bold: true },
                    { text: PdfUtils.formatNumber(orden.peso_bruto, 2, 'kg') },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'TARA: ', bold: true },
                    { text: PdfUtils.formatNumber(orden.peso_tara, 2, 'kg') },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'PESO NETO: ', bold: true },
                    { text: PdfUtils.formatNumber(orden.peso_neto, 2, 'kg') },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'PESO LIQUIDO: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(orden.peso_liquido, 2, 'kg'),
                    },
                  ],
                  style: 'field',
                },
              ],
            },
            {
              stack: [
                {
                  text: [
                    { text: 'HUMEDAD: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(
                        orden.porcentaje_humedad,
                        2,
                        '%',
                      ),
                    },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'IMPUREZAS: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(
                        orden.porcentaje_impureza,
                        2,
                        '%',
                      ),
                    },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'PESO HECTOLITRICO: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(
                        orden.peso_hectolitrico,
                        2,
                        'kg',
                      ),
                    },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'GRANO DAÑADO: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(
                        orden.porcentaje_grano_danado,
                        2,
                        '%',
                      ),
                    },
                  ],
                  style: 'field',
                },
                {
                  text: [
                    { text: 'GRANO VERDE: ', bold: true },
                    {
                      text: PdfUtils.formatNumber(
                        orden.porcentaje_grano_verde,
                        2,
                        '%',
                      ),
                    },
                  ],
                  style: 'field',
                },
              ],
            },
          ],
        ],
      },
      margin: [0, 5, 0, 5],
    };
  }
}
