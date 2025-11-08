import { Content } from 'pdfmake/interfaces';

export class PdfUtils {
  static getDateParts(date: Date) {
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  }

  static getOrderNumber(numeroOrden: string): string {
    const partes = numeroOrden.split('-');
    return partes[partes.length - 1];
  }

  static formatNumber(
    value: number | null | undefined,
    decimals = 2,
    unit = '',
  ): string {
    if (value == null) return 'N/A';
    return `${Number(value).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
  }

  static buildHeader(
    logos: { ministerio: Content; iniaf: Content },
    numeroOrden: string,
    unidadNombre: string | undefined,
    titulo: string,
    fecha: Date,
  ): Content[] {
    const { day, month, year } = this.getDateParts(fecha);
    const ultimoNumero = this.getOrderNumber(numeroOrden);

    return [
      {
        columns: [
          logos.ministerio,
          {
            text: `N°: ${ultimoNumero}`,
            alignment: 'center',
            fontSize: 12.5,
            bold: true,
            margin: [0, 20, 0, 0],
          },
          logos.iniaf,
        ],
        columnGap: 20,
      },
      {
        text: unidadNombre?.toUpperCase() || 'N/A',
        style: 'headerTitle',
      },
      { text: titulo, style: 'subHeader' },
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
    ];
  }

  static buildVehicleDriverInfo(conductor: any, vehiculo: any): any[] {
    return [
      [
        {
          columns: [
            {
              text: [
                { text: 'CHOFER: ', bold: true },
                { text: conductor?.nombre || 'N/A' },
              ],
              style: 'field',
            },
            {
              text: [
                { text: 'CI: ', bold: true },
                { text: conductor?.ci || 'N/A' },
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
                { text: vehiculo?.marca_modelo || 'N/A' },
              ],
              style: 'field',
            },
            {
              text: [
                { text: 'PLACA: ', bold: true },
                { text: vehiculo?.placa || 'N/A' },
              ],
              style: 'field',
            },
          ],
        },
      ],
    ];
  }

  static buildSignatures(): Content {
    return {
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
    };
  }
}
