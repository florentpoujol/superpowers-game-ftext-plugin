// fTextAsset plugin
// https://github.com/florentpoujol/superpowers-text-asset-plugin
// Adds a generic text asset of type text/Sup.Text

// Documentation:
// https://florentpoujol.github.io/superpowers-text-asset-plugin

// You can also access the documentation offline in the plugin's "public/docs" folder 
// or via the "Docs browser" tool provided by the "Docs browser" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin

declare module fText {
  var parsers: {
    jsonlint: any,
    CSON: any,
    domify: any,
    markdwon: any,
    jade: any,
  };
  
  function parseJSON(text: string): any; // JS Object
  function parseCSON(text: string): any; // JS Object
  function parseHTML(text: string): any; // DOM object or documentFragment
  function parseMarkdown(text: string): string;
  function parseJade(text: string): string;
  function parseStylus(text: string): string;

  // ----------------------------------------

  var assets: fText[];

  class fText extends Sup.Asset {
    constructor(inner: {[key:string]: any;});
    parseInstructions();
    getContent(options?: {noParse?: boolean, noInclude?: boolean}): string;
    content: string; //  parsed and include


  }

}

