/// <reference path="Sup.d.ts"/>

class fText extends Sup.Asset {

  /**
  * Holds the following parsers :<br>
  * - https://github.com/zaach/jsonlint <br>
  * - https://github.com/groupon/cson-parser<br>
  * - https://github.com/component/domify<br>
  * - https://github.com/evilstreak/markdown-js<br>
  * - https://github.com/jadejs/jade<br>
  * - https://github.com/stylus/stylus<br>
  * - https://github.com/nodeca/js-yaml
  */
  static parsers: {
    jsonlint: any,
    csonparser: any,
    domify: (text: string)=>any,
    markdown: any,
    jade: any,
    stylus: any,
    jsyaml: any
  } = (<any>window).fTextParsers;
  // (<any>window).fTextParsers is set in rutime/ftext.ts

  /**
  * The set of instructions which can be found in the asset's content.
  */
  instructions: { [key: string]: string|string[] } = {};

  /**
  * The asset's syntax, defined by the extension (if any) found at the end of its name.
  */
  syntax: string = "";

  // ----------------------------------------

  // called from runtime createdOuterAsset(), or by hand
  // inner is the asset's pub as defined in the asset's class
  /**
  * @param inner - The asset's pub as defined in the asset's class.
  */
  constructor(inner: {[key:string]: any;}) {
    super(inner); // sets inner as the value of this.__inner

    this._parseInstructions();

    // get asset's syntax
    let _languagesByExtensions: any = {
      md: "markdown",
      styl: "stylus",
      js: "javascript",
      yml: "yaml",
    };
    let name = this.__inner.name; // 06/09/15 where does this.__inner.name come from ? is it the path ?
    // it comes from the runtime loadAsset() where entry
    let match = name.match(/\.[a-zA-Z]+$/gi); // look for any letter after a dot at the end of the string
    if (match != null) {
      let syntax = match[0].replace(".", "");
      if (_languagesByExtensions[syntax] != null)
        syntax = _languagesByExtensions[syntax];
      this.syntax = syntax;
    }
  }

  /**
  * Read the [ftext: instruction: value] instructions in the asset's text
  * then build the this.instructions object.
  * Called once from the constructor
  */
  private _parseInstructions() {
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
          this.instructions[name] = value.trim().toLowerCase();
      }
      instructionsCount--;
    }
    while (match != null && instructionsCount > 0);
  }

  // ----------------------------------------

  /**
  * @readonly
  * The raw content of the asset.
  */
  get text(): string {
    return this.__inner.text;
  }

  // ----------------------------------------

  /**
  * Returns the content of the asset, after having parsed and processed it
  * @param options - An object with options.
  * @return JavaScript or DOM object, or string.
  */
  parse(options?: { include?: boolean }): any {
    options = options || {};
    let syntax = this.syntax;

    let parseFn = (text?: string): string => {
      if (text == null)
        text = this.__inner.text;

      let syntaxFn: Function;
      switch (syntax) {
        case "json":
          syntaxFn = fText.parsers.jsonlint.parse;
          break;
        case "cson":
          syntaxFn = fText.parsers.csonparser.parse;
          break;
        case "html":
          syntaxFn = fText.parsers.domify;
          break;
        case "markdown":
          syntaxFn = fText.parsers.markdown.toHTML;
          break;
        case "jade":
          syntaxFn = fText.parsers.jade.compile(text);
          break;
        case "stylus": 
          syntaxFn = ()=>{}; // special case
          break;
        case "yaml": 
          syntaxFn = fText.parsers.jsyaml.safeLoad;
          break;
      }
      
      if (syntaxFn != null) {
        try {
          if (syntax === "stylus")
            text = fText.parsers.stylus(text).set("imports", []).render();
          else
            text = syntaxFn(text);
        }
        catch (e) {
          console.error("fText.parse(): error parsing asset '"+this.__inner.name+"' :");
          throw e;
        }
      }
      return text;
    };

    let includeFn = (text?: string): string => {
      if (text == null)
        text = this.__inner.text;

      if (this.instructions["include"] != null) {
        for (let path of this.instructions["include"]) {
          // console.log("fTextAsset.text path", path);
          let asset = Sup.get(path, fText, {ignoreMissing: false});
          // note: for some reason, the three arguments are needed here
          let regexp = new RegExp("[<!/*#-]*\\[ftext\\s*:\\s*include\\s*:\\s*"+path.replace(".", "\\.")+"\\][>*/-]*", "i");
          text = text.replace(regexp, asset.parse(options));
        }
      }
      else if (options.include === true)
        console.log("fText.parse(): Nothing to include for asset", this.__inner.name);

      return text;
    };

    if (options.include === false)
      return parseFn();
    else {
      if (syntax === "html" || syntax === "json" || syntax === "cson" || syntax === "yaml") {
        return parseFn(includeFn());
      }
      else
        return includeFn(parseFn());
    }
  }
}

(<any>window).fText = fText;
