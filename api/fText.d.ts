// fTextAsset plugin
// https://github.com/florentpoujol/superpowers-ftext-plugin
// Adds a generic text asset of type fText

// Documentation:
// https://florentpoujol.github.io/superpowers-ftext-plugin

// You can also access the documentation offline in the plugin's "public/docs" folder 
// or via the "Docs browser" tool provided by the "Docs browser" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin

declare class fText extends Sup.Asset {
  constructor(inner: {[key:string]: any;});
  
  static parsers: {
    jsonlint: jsonlint,           // https://github.com/zaach/jsonlint
    csonparser: csonparser,       // https://github.com/groupon/cson-parser
    domify: (text: string)=>any,  // https://github.com/component/domify
    markdown: markdown,           // https://github.com/evilstreak/markdown-js
    jade: jade,                   // https://github.com/jadejs/jade
    stylus: any,                  // https://github.com/stylus/stylus
  };

  instructions: { [key: string]: string|string[] };
  syntax: string;

  text: string; // get raw content, readonly
  name: string; // readonly

  parse(options?: {
    include?: boolean,
  }): any;
}

interface jsonlint {
  parse(text: string): string;
}

interface csonparser {
  parse(text: string): string;
}

interface markdown {
  toHTML(md: string): string;
}

interface jade {
  compile(text: string): ()=>void;
}
