import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import {
  Margins,
  TDocumentDefinitions,
  StyleDictionary,
  Content,
} from 'pdfmake/interfaces';
import { OrdenIngreso } from '../ordenes-ingreso/entities/orden-ingreso.entity';
import { OrdenSalida } from '../ordenes-salidas/entities/orden-salida.entity';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { Role } from '../../common/enums/roles.enum';

@Injectable()
export class ReportesService {
  private printer: PdfPrinter;

  constructor(
    @InjectRepository(OrdenIngreso)
    private readonly ordenIngresoRepository: Repository<OrdenIngreso>,
    @InjectRepository(OrdenSalida)
    private readonly ordenSalidaRepository: Repository<OrdenSalida>,
  ) {
    const fonts = {
      Roboto: {
        normal: path.resolve(process.cwd(), 'fonts/Roboto-Regular.ttf'),
        bold: path.resolve(process.cwd(), 'fonts/Roboto-Medium.ttf'),
        italics: path.resolve(process.cwd(), 'fonts/Roboto-Italic.ttf'),
        bolditalics: path.resolve(
          process.cwd(),
          'fonts/Roboto-MediumItalic.ttf',
        ),
      },
    };

    this.printer = new PdfPrinter(fonts);
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

    if (!orden) {
      throw new NotFoundException(
        `Orden de ingreso con ID ${id} no encontrada`,
      );
    }

    if (
      user.rol !== Role.ADMIN &&
      user.id_unidad &&
      orden.id_unidad !== user.id_unidad
    ) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    const docDefinition = this.buildOrdenIngresoDocument(orden);
    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async generarOrdenSalidaPDF(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Buffer> {
    const orden = await this.ordenSalidaRepository.findOne({
      where: { id_orden_salida: id },
      relations: [
        'semillera',
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

    if (!orden) {
      throw new NotFoundException(`Orden de salida con ID ${id} no encontrada`);
    }

    if (
      user.rol !== Role.ADMIN &&
      user.id_unidad &&
      orden.id_unidad !== user.id_unidad
    ) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    const docDefinition = this.buildOrdenSalidaDocument(orden);
    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private buildOrdenIngresoDocument(orden: OrdenIngreso): TDocumentDefinitions {
    const date = new Date(orden.fecha_creacion);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const logoMinisterio: Content = {
      image: 'src/assets/mdryt.png',
      width: 120,
      height: 60,
    };

    const logoIniaf: Content = {
      image: 'src/assets/iniaf.png',
      width: 100,
      height: 50,
    };

    const styles: StyleDictionary = {
      headerTitle: {
        fontSize: 11,
        bold: true,
        alignment: 'center',
        margin: [0, 5, 0, 2],
      },
      subHeader: {
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 2, 0, 5],
      },
      field: {
        fontSize: 9,
        margin: [0, 1, 0, 1],
      },
      small: {
        fontSize: 8,
      },
    };

    const numeroOrden = orden.numero_orden;

    // Opción 1: usando split
    const partes = numeroOrden.split('-');
    const ultimoNumero = partes[partes.length - 1];

    return {
      pageSize: { width: 400, height: 600 },
      pageMargins: [20, 20, 20, 20],
      styles,
      content: [
        // Encabezado
        {
          columns: [
            logoMinisterio,
            {
              text: `N°: ${ultimoNumero}`,
              alignment: 'center',
              fontSize: 12.5,
              bold: true,
              margin: [0, 20, 0, 0],
            },
            logoIniaf,
          ],
          columnGap: 20,
        },

        {
          text: orden.unidad?.nombre?.toUpperCase() || 'N/A',
          style: 'headerTitle',
        },
        { text: 'ORDEN DE INGRESO DE SEMILLA', style: 'subHeader' },

        // Fecha
        {
          columns: [
            {
              table: {
                widths: ['*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Día',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Mes',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Año',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                  ],
                  [
                    { text: `${day}`, style: 'small', alignment: 'center' },
                    { text: `${month}`, style: 'small', alignment: 'center' },
                    { text: `${year}`, style: 'small', alignment: 'center' },
                  ],
                ],
              },
              margin: [260, 0, 1, 0],
              alignment: 'left',
            },
          ],
        },

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
              [
                {
                  columns: [
                    {
                      text: [
                        { text: 'CHOFER: ', bold: true },
                        { text: orden.conductor?.nombre || 'N/A' },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'CI: ', bold: true },
                        { text: orden.conductor?.ci || 'N/A' },
                      ],
                      style: 'field',
                    },
                  ],
                },
              ],
              [
                {
                  columns: [
                    {
                      text: [
                        { text: 'VEHÍCULO: ', bold: true },
                        { text: orden.vehiculo?.marca_modelo || 'N/A' },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'PLACA: ', bold: true },
                        { text: orden.vehiculo?.placa || 'N/A' },
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

        // Producto
        {
          table: {
            widths: ['*', '*', '*', '*', '*', '*'],
            body: [
              // ─── Fila 1 ───
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

              // ─── Fila 2 ───
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

              // ─── Fila 3 ───
              [
                {
                  text: [{ text: 'INGRESO: ', bold: true }, { text: 'N/A' }],
                  style: 'field',
                  colSpan: 3,
                },
                {},
                {},
                {
                  text: [
                    { text: 'HORA INGRESO: ', bold: true },
                    { text: 'N/A' },
                  ],
                  style: 'field',
                  colSpan: 3,
                },
                {},
                {},
              ],

              // ─── Fila 4 ───
              [
                {
                  text: [{ text: 'SALIDA: ', bold: true }, { text: 'N/A' }],
                  style: 'field',
                  colSpan: 3,
                },
                {},
                {},
                {
                  text: [
                    { text: 'HORA SALIDA: ', bold: true },
                    { text: 'N/A' },
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
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: 'DATOS DE PESAJE',
                  style: 'subHeader',
                },
                {
                  text: 'DESCRIPCIÓN',
                  style: 'subHeader',
                },
              ],
              [
                {
                  stack: [
                    {
                      text: [
                        { text: 'PESO BRUTO: ', bold: true },
                        {
                          text:
                            orden.peso_bruto != null
                              ? `${Number(orden.peso_bruto).toFixed(2)} kg`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'TARA: ', bold: true },
                        {
                          text:
                            orden.peso_tara != null
                              ? `${Number(orden.peso_tara).toFixed(2)} kg`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'PESO NETO: ', bold: true },
                        {
                          text:
                            orden.peso_neto != null
                              ? `${Number(orden.peso_neto).toFixed(2)} kg`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'PESO LIQUIDO: ', bold: true },
                        {
                          text:
                            orden.peso_liquido != null
                              ? `${Number(orden.peso_liquido).toFixed(2)} kg`
                              : 'N/A',
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
                          text:
                            orden.porcentaje_humedad != null
                              ? `${Number(orden.porcentaje_humedad).toFixed(
                                  2,
                                )} %`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'IMPUREZAS: ', bold: true },
                        {
                          text:
                            orden.porcentaje_impureza != null
                              ? `${Number(orden.porcentaje_impureza).toFixed(
                                  2,
                                )} %`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'PESO HECTOLITRICO: ', bold: true },
                        {
                          text:
                            orden.peso_hectolitrico != null
                              ? `${Number(orden.peso_hectolitrico).toFixed(
                                  2,
                                )} kg`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'GRANO DAÑADO: ', bold: true },
                        {
                          text:
                            orden.porcentaje_grano_danado != null
                              ? `${Number(
                                  orden.porcentaje_grano_danado,
                                ).toFixed(2)} %`
                              : 'N/A',
                        },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'GRANO VERDE: ', bold: true },
                        {
                          text:
                            orden.porcentaje_grano_verde != null
                              ? `${Number(orden.porcentaje_grano_verde).toFixed(
                                  2,
                                )} %`
                              : 'N/A',
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
        },

        // Observaciones
        ...(orden.observaciones
          ? [
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
            ]
          : []),

        // Firmas
        {
          text: `AUTORIZADO POR: `,
          style: 'field',
          margin: [0, 5, 0, 30],
        },
        {
          columns: [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 20, 0, 2],
                },
                {
                  text: 'JEFE DE UNIDAD Ó ENCARGADO DE ALMACÉN',
                  alignment: 'center',
                  fontSize: 7,
                },
              ],
              alignment: 'center',
            },
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 20, 0, 2],
                },
                {
                  text: 'ENTREGUE CONFORME (Firma y Nombre)',
                  alignment: 'center',
                  fontSize: 7,
                },
              ],
              alignment: 'center',
            },
          ],
        },
      ],
    };
  }

  private buildOrdenSalidaDocument(orden: OrdenSalida): TDocumentDefinitions {
    const totalRow = [
      {
        text: 'TOTAL',
        style: 'small',
        bold: true,
        alignment: 'right',
        colSpan: 5, // ocupa las primeras 5 columnas
        border: [false, true, false, false], // si no quieres borde inferior
      },
      {},
      {},
      {},
      {}, // ← estos son obligatorios para las columnas que ocupa
      {
        text: 'Texto del total',
        style: 'small',
        bold: true,
        alignment: 'right',
        border: [false, true, false, false], // igual sin borde inferior si deseas
      },
    ];

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
        { text: `${Number(detalle.kg_por_unidad).toFixed(2)}`, style: 'small' },
        { text: `${Number(detalle.total_kg).toFixed(2)}`, style: 'small' },
      ]),
    ];

    const date = new Date(orden.fecha_creacion);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const logoMinisterio: Content = {
      image: 'src/assets/mdryt.png',
      width: 120,
      height: 60,
    };

    const logoIniaf: Content = {
      image: 'src/assets/iniaf.png',
      width: 100,
      height: 50,
    };

    const styles: StyleDictionary = {
      headerTitle: {
        fontSize: 11,
        bold: true,
        alignment: 'center',
        margin: [0, 5, 0, 2],
      },
      subHeader: {
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 2, 0, 5],
      },
      field: {
        fontSize: 9,
        margin: [0, 1, 0, 1],
      },
      small: {
        fontSize: 8,
      },
      title: {
        fontSize: 9,
        bold: true,
        alignment: 'center',
        margin: [0, 1, 0, 1],
      },
    };
    const numeroOrden = orden.numero_orden;

    const partes = numeroOrden.split('-');
    const ultimoNumero = partes[partes.length - 1];

    return {
      pageSize: { width: 400, height: 600 },
      pageMargins: [20, 20, 20, 20],
      styles,
      content: [
        // Encabezado
        {
          columns: [
            logoMinisterio,
            {
              text: `N°: ${ultimoNumero}`,
              alignment: 'center',
              fontSize: 12.5,
              bold: true,
              margin: [0, 20, 0, 0],
            },
            logoIniaf,
          ],
          columnGap: 20,
        },

        {
          text: orden.unidad?.nombre?.toUpperCase() || 'N/A',
          style: 'headerTitle',
        },
        { text: 'ORDEN DE SALIDA DE SEMILLA', style: 'subHeader' },

        // Fecha
        {
          columns: [
            {
              table: {
                widths: ['*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Día',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Mes',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Año',
                      style: 'small',
                      bold: true,
                      alignment: 'center',
                    },
                  ],
                  [
                    { text: `${day}`, style: 'small', alignment: 'center' },
                    { text: `${month}`, style: 'small', alignment: 'center' },
                    { text: `${year}`, style: 'small', alignment: 'center' },
                  ],
                ],
              },
              margin: [260, 0, 1, 0],
              alignment: 'left',
            },
          ],
        },

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
              [
                {
                  columns: [
                    {
                      text: [
                        { text: 'CHOFER: ', bold: true },
                        { text: orden.conductor?.nombre || 'N/A' },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'CI: ', bold: true },
                        { text: orden.conductor?.ci || 'N/A' },
                      ],
                      style: 'field',
                    },
                  ],
                },
              ],
              [
                {
                  columns: [
                    {
                      text: [
                        { text: 'VEHÍCULO: ', bold: true },
                        { text: orden.vehiculo?.marca_modelo || 'N/A' },
                      ],
                      style: 'field',
                    },
                    {
                      text: [
                        { text: 'PLACA: ', bold: true },
                        { text: orden.vehiculo?.placa || 'N/A' },
                      ],
                      style: 'field',
                    },
                  ],
                },
              ],
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

        {
          table: {
            widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
            body: detallesTableBody,
          },
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'TOTAL: ',
                  bold: true,
                  alignment: 'left',
                  fontSize: 8.5,
                  margin: [0, 0, 0, 0],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 1 ? 1 : 0;
            },
          },
        },
        {
          text: '\n',
        },
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

        // Firmas
        {
          text: `AUTORIZADO POR: `,
          style: 'field',
          margin: [0, 5, 0, 30],
        },
        {
          columns: [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 20, 0, 2],
                },
                {
                  text: 'JEFE DE UNIDAD Ó ENCARGADO DE ALMACÉN',
                  alignment: 'center',
                  fontSize: 7,
                },
              ],
              alignment: 'center',
              //absolutePosition: { x: -170, y: 520 },
            },
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 20, 0, 2],
                },
                {
                  text: 'ENTREGUE CONFORME (Firma y Nombre)',
                  alignment: 'center',
                  fontSize: 7,
                },
              ],
              alignment: 'center',
              //absolutePosition: { x: 190, y: 520 },
            },
          ],
        },
      ],
      footer: [
        {
          text: 'Nota: Nuestra responsabilidad cesa al momento que firma y sale de nuestras instalaciones.',
          alignment: 'center',
          fontSize: 7,
        },
      ],
    };
  }
}
