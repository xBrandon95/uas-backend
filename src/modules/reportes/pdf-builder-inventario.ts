import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { PdfConfig } from './pdf.config';
import { PdfUtils } from './pdf.utils';

interface InventarioItem {
  variedad: string;
  semilla: string;
  categoria: string;
  total_unidades: string;
  total_kg: string;
}

interface FiltrosInventario {
  unidadNombre?: string;
  semillaNombre?: string;
  variedadNombre?: string;
  categoriaNombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export class PdfBuilderInventario {
  static build(
    inventario: InventarioItem[],
    filtros: FiltrosInventario,
  ): TDocumentDefinitions {
    const logos = PdfConfig.getLogos();
    const styles = PdfConfig.getCommonStyles();

    // Calcular totales
    const totales = inventario.reduce(
      (acc, item) => ({
        unidades: acc.unidades + Number(item.total_unidades),
        kg: acc.kg + Number(item.total_kg),
      }),
      { unidades: 0, kg: 0 },
    );

    const content: Content[] = [
      // Encabezado
      {
        columns: [
          logos.ministerio,
          {
            text: 'REPORTE DE INVENTARIO',
            alignment: 'center',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 0],
          },
          logos.iniaf,
        ],
        columnGap: 20,
        margin: [0, 0, 0, 10],
      },

      // Fecha del reporte
      {
        text: `Fecha: ${new Date().toLocaleDateString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 0, 0, 10],
      },

      // Información de filtros aplicados
      this.buildFiltrosSection(filtros),

      // Tabla de inventario
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 'auto', 'auto'],
          body: [
            [
              {
                text: 'SEMILLA',
                style: 'title',
                fillColor: '#e0e0e0',
              } as any,
              {
                text: 'VARIEDAD',
                style: 'title',
                fillColor: '#e0e0e0',
              } as any,
              {
                text: 'CATEGORÍA',
                style: 'title',
                fillColor: '#e0e0e0',
              } as any,
              {
                text: 'UNIDADES',
                style: 'title',
                alignment: 'right',
                fillColor: '#e0e0e0',
              } as any,
              {
                text: 'TOTAL KG',
                style: 'title',
                alignment: 'right',
                fillColor: '#e0e0e0',
              } as any,
            ],
            ...inventario.map((item, index) => [
              {
                text: item.semilla,
                style: 'small',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
              } as any,
              {
                text: item.variedad,
                style: 'small',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
              } as any,
              {
                text: item.categoria,
                style: 'small',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
              } as any,
              {
                text: Number(item.total_unidades).toLocaleString('es-BO'),
                style: 'small',
                alignment: 'right',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
              } as any,
              {
                text: Number(item.total_kg).toFixed(2),
                style: 'small',
                alignment: 'right',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
              } as any,
            ]),
            // Fila de totales
            [
              {
                text: 'TOTALES',
                style: 'title',
                colSpan: 3,
                fillColor: '#d0d0d0',
              } as any,
              {} as any,
              {} as any,
              {
                text: totales.unidades.toLocaleString('es-BO'),
                style: 'title',
                alignment: 'right',
                fillColor: '#d0d0d0',
              } as any,
              {
                text: totales.kg.toFixed(2),
                style: 'title',
                alignment: 'right',
                fillColor: '#d0d0d0',
              } as any,
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
        margin: [0, 10, 0, 10],
      } as any,

      // Resumen
      {
        text: '\n',
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'RESUMEN DEL INVENTARIO',
                style: 'subHeader',
                fillColor: '#e0e0e0',
              },
            ],
            [
              {
                stack: [
                  {
                    text: [
                      { text: 'Total de productos: ', bold: true },
                      { text: `${inventario.length}` },
                    ],
                    style: 'field',
                  },
                  {
                    text: [
                      { text: 'Total de unidades: ', bold: true },
                      {
                        text: `${totales.unidades.toLocaleString(
                          'es-BO',
                        )} unidades`,
                      },
                    ],
                    style: 'field',
                  },
                  {
                    text: [
                      { text: 'Peso total: ', bold: true },
                      { text: `${totales.kg.toFixed(2)} kg` },
                    ],
                    style: 'field',
                  },
                ],
                margin: [5, 5, 5, 5],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
      },
    ];

    return {
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      styles,
      content,
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0],
      }),
    };
  }

  private static buildFiltrosSection(filtros: FiltrosInventario): Content {
    const filtrosAplicados: string[] = [];

    if (filtros.unidadNombre) {
      filtrosAplicados.push(`Unidad: ${filtros.unidadNombre}`);
    }
    if (filtros.semillaNombre) {
      filtrosAplicados.push(`Semilla: ${filtros.semillaNombre}`);
    }
    if (filtros.variedadNombre) {
      filtrosAplicados.push(`Variedad: ${filtros.variedadNombre}`);
    }
    if (filtros.categoriaNombre) {
      filtrosAplicados.push(`Categoría: ${filtros.categoriaNombre}`);
    }
    if (filtros.fechaInicio && filtros.fechaFin) {
      filtrosAplicados.push(
        `Período: ${new Date(filtros.fechaInicio).toLocaleDateString(
          'es-BO',
        )} - ${new Date(filtros.fechaFin).toLocaleDateString('es-BO')}`,
      );
    } else if (filtros.fechaInicio) {
      filtrosAplicados.push(
        `Desde: ${new Date(filtros.fechaInicio).toLocaleDateString('es-BO')}`,
      );
    } else if (filtros.fechaFin) {
      filtrosAplicados.push(
        `Hasta: ${new Date(filtros.fechaFin).toLocaleDateString('es-BO')}`,
      );
    }

    if (filtrosAplicados.length === 0) {
      return {
        text: 'Filtros: Todos los registros disponibles',
        style: 'field',
        margin: [0, 0, 0, 10],
        italics: true,
      };
    }

    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'FILTROS APLICADOS',
              style: 'subHeader',
              fillColor: '#f0f0f0',
            },
          ],
          [
            {
              ul: filtrosAplicados,
              style: 'small',
              margin: [5, 5, 5, 5],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      },
      margin: [0, 0, 0, 10],
    };
  }
}
