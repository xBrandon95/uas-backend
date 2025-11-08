import * as path from 'path';
import { StyleDictionary, Content } from 'pdfmake/interfaces';

export class PdfConfig {
  static getFonts() {
    const fontPath = (name: string) =>
      path.resolve(process.cwd(), `fonts/${name}`);
    return {
      Roboto: {
        normal: fontPath('Roboto-Regular.ttf'),
        bold: fontPath('Roboto-Medium.ttf'),
        italics: fontPath('Roboto-Italic.ttf'),
        bolditalics: fontPath('Roboto-MediumItalic.ttf'),
      },
    };
  }

  static getCommonStyles(): StyleDictionary {
    return {
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
  }

  static getLogos(): { ministerio: Content; iniaf: Content } {
    return {
      ministerio: {
        image: 'src/assets/mdryt.png',
        width: 120,
        height: 60,
      },
      iniaf: {
        image: 'src/assets/iniaf.png',
        width: 100,
        height: 50,
      },
    };
  }

  static getPageConfig() {
    return {
      pageSize: { width: 400, height: 600 },
      pageMargins: [20, 20, 20, 20] as [number, number, number, number],
    };
  }
}
