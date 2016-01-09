// fText plugin
// https://github.com/florentpoujol/superpowers-ftext-plugin
// Adds a generic text asset of type fText

// Documentation:
// https://florentpoujol.github.io/superpowers-ftext-plugin

// You can also access the documentation offline in the plugin's "public/docs" folder 
// or via the "Docs browser" tool provided by the "Docs browser" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin

declare class fText extends Sup.Asset {
  constructor(inner: { [key: string]: any; });

  static parsers: {
    jsonlint: any,                // https://github.com/zaach/jsonlint
    csonparser: any,              // https://github.com/groupon/cson-parser
    domify: (text: string) => any,  // https://github.com/component/domify
    markdown: any,                // https://github.com/evilstreak/markdown-js
    jade: any,                    // https://github.com/jadejs/jade
    stylus: any,                  // https://github.com/stylus/stylus
    jsyaml: any,                  // https://github.com/nodeca/js-yaml
  };

  instructions: { [key: string]: string | string[] };
  syntax: string;

  text: string; // get raw content, readonly

  parse(options?: {
    include?: boolean,
  }): any;  
}