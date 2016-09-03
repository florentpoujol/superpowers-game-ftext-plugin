// fText plugin
// https://github.com/florentpoujol/superpowers-game-ftext-plugin
// Adds a generic text asset of type FText

declare class fText extends Sup.Asset {
  constructor(inner: { [key: string]: any; });

  static parsers: {
    jsonlint: any,
    csonparser: any,
    domify: (text: string) => any,
    markdown: any,
    pug: any,
    stylus: any,
    jsyaml: any,
  };

  getText(): string;
  parse(options?: {
    include?: boolean,
  }): any;
}
