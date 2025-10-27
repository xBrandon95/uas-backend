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
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Mes',
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Año',
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                  ],
                  [
                    { text: `${day}`, style: 'field', alignment: 'center' },
                    { text: `${month}`, style: 'field', alignment: 'center' },
                    { text: `${year}`, style: 'field', alignment: 'center' },
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
                  text: `SEMILLERA: ${orden.semillera?.nombre || 'N/A'}`,
                  style: 'field',
                },
              ],
              [
                {
                  text: `COOPERADOR: ${orden.cooperador?.nombre || 'N/A'}`,
                  style: 'field',
                },
              ],
              [
                {
                  columns: [
                    {
                      text: `CHOFER: ${orden.conductor?.nombre || 'N/A'}`,
                      style: 'field',
                    },
                    {
                      text: `CI: ${orden.conductor?.ci || 'N/A'}`,
                      style: 'field',
                    },
                  ],
                },
              ],
              [
                {
                  columns: [
                    {
                      text: `VEHÍCULO: ${
                        orden.vehiculo?.marca_modelo || 'N/A'
                      }`,
                      style: 'field',
                    },
                    {
                      text: `PLACA: ${orden.vehiculo?.placa || 'N/A'}`,
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
            widths: ['*', '*', '*'],
            body: [
              [
                {
                  text: `PRODUCTO: ${orden.semilla?.nombre || 'N/A'}`,
                  style: 'field',
                },
                {
                  text: `VARIEDAD: ${orden.variedad?.nombre || 'N/A'}`,
                  style: 'field',
                },
                {
                  text: `CATEGORÍA: ${
                    orden.categoria_ingreso?.nombre || 'N/A'
                  }`,
                  style: 'field',
                },
              ],
              [
                {
                  text: `N° LOTE: ${orden.nro_lote_campo || 'N/A'}`,
                  style: 'field',
                },
                {
                  text: `N° BOLSAS: `,
                  style: 'field',
                },
                {
                  text: `N° CUPÓN: ${orden.nro_cupon || 'N/A'}`,
                  style: 'field',
                },
              ],
              [
                {
                  columns: [
                    { text: `INGRESO: N/A`, style: 'field' },
                    { text: `HORA: N/A`, style: 'field' },
                  ],
                  colSpan: 3,
                },
              ],
              [
                {
                  columns: [
                    { text: `SALIDA: N/A`, style: 'field' },
                    {
                      text: `HORA: ${orden.hora_salida || 'N/A'}`,
                      style: 'field',
                    },
                  ],
                  colSpan: 3,
                },
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
                      text: `PESO BRUTO: ${
                        orden.peso_bruto != null
                          ? Number(orden.peso_bruto).toFixed(2)
                          : 'N/A'
                      } kg`,
                      style: 'field',
                    },
                    {
                      text: `PESO TARA: ${
                        orden.peso_tara != null
                          ? Number(orden.peso_tara).toFixed(2)
                          : 'N/A'
                      } kg`,
                      style: 'field',
                    },
                    {
                      text: `PESO NETO: ${
                        orden.peso_neto != null
                          ? Number(orden.peso_neto).toFixed(2)
                          : 'N/A'
                      } kg`,
                      style: 'field',
                    },
                    {
                      text: `PESO LÍQUIDO: ${
                        orden.peso_liquido != null
                          ? Number(orden.peso_liquido).toFixed(2)
                          : 'N/A'
                      } kg`,
                      style: 'field',
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: `HUMEDAD: ${
                        orden.porcentaje_humedad != null
                          ? Number(orden.porcentaje_humedad).toFixed(2)
                          : 'N/A'
                      } %`,
                      style: 'field',
                    },
                    {
                      text: `IMPUREZA: ${
                        orden.porcentaje_impureza != null
                          ? Number(orden.porcentaje_impureza).toFixed(2)
                          : 'N/A'
                      } %`,
                      style: 'field',
                    },
                    {
                      text: `PESO HECTOLÍTRICO: ${
                        orden.peso_hectolitrico != null
                          ? Number(orden.peso_hectolitrico).toFixed(2)
                          : 'N/A'
                      } %`,
                      style: 'field',
                    },
                    {
                      text: `GRANO DAÑADO: ${
                        orden.porcentaje_grano_danado != null
                          ? Number(orden.porcentaje_grano_danado).toFixed(2)
                          : 'N/A'
                      } %`,
                      style: 'field',
                    },
                    {
                      text: `GRANO VERDE: ${
                        orden.porcentaje_grano_verde != null
                          ? Number(orden.porcentaje_grano_verde).toFixed(2)
                          : 'N/A'
                      } %`,
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
                        text: `OBSERVACIONES: ${orden.observaciones}`,
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
    const detallesTableBody = [
      [
        { text: 'Lote', style: 'subHeader' },
        { text: 'Variedad', style: 'subHeader' },
        { text: 'Categoría', style: 'subHeader' },
        { text: 'Bolsas', style: 'subHeader' },
        { text: 'Kg/Bolsa', style: 'subHeader' },
        { text: 'Total Kg', style: 'subHeader' },
      ],
      ...orden.detalles.map((detalle) => [
        { text: detalle.nro_lote, style: 'field' },
        { text: detalle.variedad?.nombre || 'N/A', style: 'field' },
        { text: detalle.categoria?.nombre || 'N/A', style: 'field' },
        { text: detalle.nro_bolsas.toString(), style: 'field' },
        { text: `${Number(detalle.kg_bolsa).toFixed(2)}`, style: 'field' },
        { text: `${Number(detalle.total_kg).toFixed(2)}`, style: 'field' },
      ]),
    ];

    // const totalBolsas = orden.detalles.reduce(
    //   (sum, d) => sum + d.nro_bolsas,
    //   0,
    // );
    // const totalKg = orden.detalles.reduce(
    //   (sum, d) => sum + Number(d.total_kg),
    //   0,
    // );

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
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Mes',
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: 'Año',
                      style: 'field',
                      bold: true,
                      alignment: 'center',
                    },
                  ],
                  [
                    { text: `${day}`, style: 'field', alignment: 'center' },
                    { text: `${month}`, style: 'field', alignment: 'center' },
                    { text: `${year}`, style: 'field', alignment: 'center' },
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
                  text: `SEMILLERA: ${orden.semillera?.nombre || 'N/A'}`,
                  style: 'field',
                },
              ],
              [
                {
                  text: `CLIENTE: ${orden.cliente?.nombre || 'N/A'}`,
                  style: 'field',
                },
              ],
              [
                {
                  columns: [
                    {
                      text: `CHOFER: ${orden.conductor?.nombre || 'N/A'}`,
                      style: 'field',
                    },
                    {
                      text: `CI: ${orden.conductor?.ci || 'N/A'}`,
                      style: 'field',
                    },
                  ],
                },
              ],
              [
                {
                  columns: [
                    {
                      text: `VEHÍCULO: ${
                        orden.vehiculo?.marca_modelo || 'N/A'
                      }`,
                      style: 'field',
                    },
                    {
                      text: `PLACA: ${orden.vehiculo?.placa || 'N/A'}`,
                      style: 'field',
                    },
                  ],
                },
              ],
              [
                {
                  columns: [
                    {
                      text: `PRODUCTO: ${orden.semilla?.nombre || 'N/A'}`,
                      style: 'field',
                    },
                    {
                      text: `DEPÓSITO: ${orden.deposito || 'N/A'}`,
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
          text: '\n',
        },
        // {
        //   text: `\nTotales: ${totalBolsas} bolsas | ${totalKg.toFixed(2)} kg`,
        //   style: 'value',
        //   alignment: 'right',
        // },

        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: `OBSERVACIONES: ${orden.observaciones}`,
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
