// fText plugin
// https://github.com/florentpoujol/superpowers-ftext-plugin
// Adds a generic text asset of type FText

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

  getText(): string;
  parse(options?: {
    include?: boolean,
  }): any;
}
