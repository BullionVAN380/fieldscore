declare module 'react-native-html-to-pdf' {
  export interface RNHTMLtoPDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
  }

  export interface RNHTMLtoPDFResult {
    filePath: string;
    base64?: string;
  }

  export default class RNHTMLtoPDF {
    static convert(options: RNHTMLtoPDFOptions): Promise<RNHTMLtoPDFResult>;
  }
}
