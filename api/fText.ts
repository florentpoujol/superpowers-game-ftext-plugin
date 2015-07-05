/// <reference path="Sup.d.ts"/>

class fText extends Sup.Asset {

  static parsers: any = (<any>window).fTextParsers;

  // filled by parseInstructions()
  instructions: { [key: string]: string|string[] } = {};

  constructor(inner: {[key:string]: any;}) {
    super(inner); // sets inner as the value of this.__inner

    this._parseInstructions();
    if (this.instructions["syntax"] == null) {
      let _languagesByExtensions: any = {
        md: "markdown",
        styl: "stylus",
      };
      let name = this.__inner.name;
      let match = name.match(/\.[a-zA-Z]+$/gi);
      if (match != null) {
        let syntax = match[0].replace(".", "");
         if (_languagesByExtensions[syntax] != null)
          syntax = _languagesByExtensions[syntax];
        this.instructions["syntax"] = syntax;
      }
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

  get text(): string {
    return this.__inner.text;
  }

  get name(): string {
    return this.__inner.name;
  }
  
  /**
  * Returns the content of the asset, after having parsed and processed it
  * @param options - An object with options.
  * @return JavaScript or DOM object, or string.
  */
  parse(options?: { include?: boolean }): any {
    options = options || {};
    let syntax = <string>this.instructions["syntax"];

    let parseFn = (text?: string): string => {
      text = text || this.__inner.text;

      let syntaxFn: Function;
      switch (syntax) {
        case "json":
          syntaxFn = fText.parsers.jsonlint.parse;
          break;
        case "cson":
          syntaxFn = fText.parsers.cson.parse;
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
          syntaxFn = ()=>{};
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
          console.error("fText.parse(): error parsing asset", this.__inner.name);
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
          let re = new RegExp("[<!/*#-]*\\[ftext\\s*:\\s*include\\s*:\\s*"+path.replace(".", "\\.")+"\\][>*/-]*", "i");
          text = text.replace(re, asset.parse(options));
        }
      }
      else if (options.include === true)
        console.log("fText.parse(): Nothing to include for asset", this.__inner.name);

      return text;
    };

    if (options.include === false)
      return parseFn();
    else {
      if (syntax === "html" || syntax === "json" || syntax === "cson") {
        return parseFn(includeFn());
      }
      else
        return includeFn(parseFn());
    }
  }
}

(<any>window).fText = fText;
