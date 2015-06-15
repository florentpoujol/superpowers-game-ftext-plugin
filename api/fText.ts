/// <reference path="Sup.d.ts"/>


module fText {
  export var parsers: any = (<any>window).fTextParsers;

  /**
  * Parse a JSON string to JS object.
  * @param json - Some JSON string to be parsed.
  * @returns A JavaScript object.
  */
  export function parseJSON(json: string): any {
    json = json.replace(/\/\/.*/gi, "");
    return parsers.jsonlint.parse(json); // use jsonlint because the error messages returned by the built-in JSON doesn't help at all...
  }

  /**
  * Parse a CSON string to JS object.
  * @param cson - Some CSON string to be parsed.
  * @returns A JavaScript object.
  */
  export function parseCSON(cson: string): any {
    return parsers.CSON.parse(cson); 
  }

  /**
  * Parse a HTML string to DOM Element.
  * @param html - Some HTML string to be parsed.
  * @returns A single DOM Node instance if there was a single root element in the provided HTML, or a DocumentFragment instance.
  */
  export function parseHTML(html: string): any {
    html = html.replace(/<!--.*-->/gi, ""); // remove comments before domify
    // return parsers.domify(dom);
    return parsers.domify.parse(html); 
    // domify has been modified so that it could be used by the settingsEditor class
    // the modification doesn't expose domify as an alias for domify.parse() 
  }

  /**
  * Parse a markdown string to HTML string.
  * @param md - Some Markdown string to be parsed.
  * @returns A valid HTML string.
  */
  export function parseMarkdown(md: string): string {
    return parsers.markdown.toHTML(md);
  }

  /**
  * Parse a Jade string to HTML string. <br>
  * Note that the support of Jade's features is basically limited to the syntactic sugars (no includes, no code...).
  * @param jade - Some Jade string to be parsed.
  * @returns A valid HTML string.
  */
  export function parseJade(jade: string): string {
    return parsers.jade.compile(jade)();
  }

  /**
  * Parse a Stylus string to CSS string. <br>
  * Note that the support of Stylu's features is basically limited to the syntactic sugars (no includes).
  * @param stylus - Some Stylus string to be parsed.
  * @returns A valid CSS string.
  */
  export function parseStylus(stylus: string): string {
    return "stylus";
  }

  // --------------------------------------------------------------------------------

  /**
  * @private
  * Modes that have a parse function.
  */
  let _parsableSyntaxes: string[] = ["JSON", "CSON", "HTML", "Jade", "Markdown", "Less", "Stylus"];

  /**
  * @private
  */
  let _lcParsableSyntaxes: string[] = ["json", "cson", "html", "jade", "markdown", "less", "stylus"];

  /**
  * @private
  */
  let _languagesByExtensions: any = {
    md: "markdown",
    styl: "stylus",
  };

  export var assets: fText[] = [];

  export class fText extends Sup.Asset {

    // filled by parseInstructions()
    instructions: { [key: string]: string|string[] } = {};

    constructor(inner: {[key:string]: any;}) {
      super(inner); // sets inner as the value of this.__inner

      this.parseInstructions();
      if (this.instructions["syntax"] == null) {
        let name = this.__inner.name;
        let match = name.match(/\.[a-zA-Z]+$/gi);
        if (match != null) {
          let syntax = match[0].replace(".", "");
           if (_languagesByExtensions[syntax] != null)
            syntax = _languagesByExtensions[syntax];
          this.instructions["syntax"] = syntax;
        }
      }

      assets.push(this);
    }

    /**
    * Read the [ftext: instruction: value] instructions in the asset's text
    * then build the this.instructions object.
    * Called once from the constructor
    */
    parseInstructions() {
      let regex = /\[ftext\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?\]/ig
      let match: any;
      let instructionsCount = (this.__inner.text.match(/\[\s*ftext/ig) || []).length; // prevent infinite loop
      do {
        match = regex.exec(this.__inner.text);
        if (match != null && match[1] != null) {
          let name = match[1].trim().toLowerCase();
          let value = match[3];
          if (value != null) value = value.trim();
          else value = "";
          if (name === "include") {
            if (this.instructions[name] == null) this.instructions[name] = [];
            (<string[]>this.instructions[name]).push(value);
          }
          else
            this.instructions[name] = value;
        }
        instructionsCount--;
      }
      while (match != null && instructionsCount > 0);
    }

    // ----------------------------------------

    /**
    * Returns the content of the asset, after having parsed and processed it
    * @param options - An object with options.
    * @return JavaScript or DOM object, or string.
    */
    getContent(options?: {parse?: boolean, include?: boolean}): any {
      options = options || {};
      let parse = (options.parse !== false);
      let include = (options.include !== false);
      
      if (parse === false && include === false) 
        return this.__inner.text;
      
      else {
        let parseFn = (text?: string): string => {
          let syntax = <string>this.instructions["syntax"];
          if (syntax == null) {
            console.error("fText.fText.getContent(): can't parse asset '"+this.__inner.name+"' because the syntax in unkown.");
            return "Error unkown syntax.";
          }
          
          var i = _lcParsableSyntaxes.indexOf(syntax.toLowerCase());
          if (i !== -1) {
            let parsed: any;
            try {
              let fn = (<any>window).fText["parse"+_parsableSyntaxes[i]];
              parsed = fn(text || this.__inner.text);
            }
            catch (e) {
              console.error("fText.fText.getContent(): error parsing asset", this.__inner.name);
              throw e;
            }
            return parsed;
          }
          else {
            console.error("fText.fText.getContent(): No parse[Syntax]() function found for syntax:", syntax);
            return "Error unknow parse method.";
          }
        };

        let includeFn = (text?: string): string => {
          if (text == null)
            text = this.__inner.text;

          if (this.instructions["include"] != null) {
            for (let path of this.instructions["include"]) {
              // console.log("fTextAsset.text path", path);
              let asset = Sup.get(path, fText, {ignoreMissing: false});
              // note: for some reason, the three arguments are needed here
              let re = new RegExp("[<!/*#-]*\\[ftext\\s*:\\s*include\\s*:\\s*"+path.replace(".", "\\.")+"\\][>*/-]*", "i");
              // console.log(re);
              text = text.replace(re, asset.getContent(options));
            }
          }
          else if (options.include === true)
            console.log("fText.fText.getContent(): Nothing to include for asset", this.__inner.name);

          return text;
        };

        if (parse === true && include === false)
          return parseFn();
        else if (parse === false && include === true)
          return includeFn();
        else {
          if (this.instructions["syntax"] === "html"){
            // include before parsing when parsing from html to dom
            return parseFn(includeFn());
          }
          else
            return includeFn(parseFn());
        }
      }
    } // end of getContent()

    get content(): any {
      return this.getContent();
    }
  } // end of fText class
}

(<any>window).fText = fText;
