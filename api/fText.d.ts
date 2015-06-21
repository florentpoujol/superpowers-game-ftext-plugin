// fTextAsset plugin
// https://github.com/florentpoujol/superpowers-ftext-plugin
// Adds a generic text asset of type text/Sup.Text

// Documentation:
// https://florentpoujol.github.io/superpowers-ftext-plugin

// You can also access the documentation offline in the plugin's "public/docs" folder 
// or via the "Docs browser" tool provided by the "Docs browser" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin

declare class fText extends Sup.Asset {
  constructor(inner: {[key:string]: any;});
  
  static parsers: {
    jsonlint: jsonlint,
    CSON: cson,
    domify: (text: string)=>any,
    markdwon: markdown,
    jade: jade,
    stylus: any,
  };

  text: string; // get raw content
  name: string;

  parse(options?: {
    include?: boolean,
  }): any;
}

interface jsonlint {
  parse(text: string): string;
}

interface cson {
  parse(text: string): string;
}

interface jade {
  compile(text: string): ()=>void;
}

interface markdown {
  toHTML(md: string): string;
}
