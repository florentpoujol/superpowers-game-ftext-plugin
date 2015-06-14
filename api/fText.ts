/// <reference path="Sup.d.ts"/>

/**
* @private
* Modes that have a parse function.
*/
let __parsableModes: string[] = ["JSON", "CSON", "HTML", "Jade", "Markdown", "Less", "Stylus"];

/**
* @private
*/
let __lcParsableModes: string[] = ["json", "cson", "html", "jade", "markdown", "less", "stylus"];

let extensions: any = {
  md: "markdown",
  styl: "stylus",
};

(<any>window).fTextAssets = [];

module fText {
  export var parsers: any = (<any>window).fTextParsers;

  export class fText extends Sup.Asset {

    // filled by parseInstructions(), called from the constructor
    instructions: { [key: string]: string|string[] } = {};

    constructor(asset: any) {
      super(asset);

      this.parseInstructions();
      if (this.instructions["syntax"] == null) {
        let name = this.__inner.name;
        let match = name.match(/\.[a-zA-Z]+$/gi);
        if (match != null) {
          let syntax = match[0].replace(".", "");
           if (extensions[syntax] != null)
            syntax = extensions[syntax];
          this.instructions["syntax"] = syntax;
        }
      }

      (<any>window).fTextAssets.push(this);
    }

    
    getContent(options?: {parse?: boolean, include?: boolean}): any {
      options = options || {};
      let parse = (options.parse !== false);
      let include = (options.include !== false);
      
      if (parse === false && include === false) 
        return this.__inner.text;
      
      else {
        let parseFn = (): string => {
          let syntax = <string>this.instructions["syntax"];
          if (syntax == null) {
            console.error("fText.fText.getContent(): can't parse asset '"+this.__inner.name+"' because the syntax in unkown.");
            return "Error unkown syntax.";
          }
          
          var i = __lcParsableModes.indexOf(syntax.toLowerCase());
          if (i !== -1) {
            let parsed: any;
            try {
              parsed = (<any>this)["parse"+__parsableModes[i]]();
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
        else
          return includeFn(parseFn());
      }
    } // end of getContent()

    get content(): any {
      return this.getContent();
    }

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

    // --------------------------------------------------------------------------------

    /**
    * Parse a JSON string to JS object.
    * @returns A JavaScript object.
    */
    parseJSON(): any {
      let text: string = this.__inner.text.replace(/\/\/.*/gi, "");
      return parsers.jsonlint.parse(text); // use jsonlint because the error messages returned by the built-in JSON doesn't help at all...
    }

    /**
    * Parse a CSON string to JS object.
    * @returns A JavaScript object.
    */
    parseCSON(): any {
      return parsers.CSON.parse(this.__inner.text); 
    }

    /**
    * Parse a HTML string to DOM Element.
    * @returns A single DOM Node instance if there was a single root element in the provided HTML, or a DocumentFragment instance.
    */
    parseHTML(): any {
      var dom = this.__inner.text.replace(/<!--.*-->/gi, ""); // remove comments before domify
      // return parsers.domify(dom);
      return parsers.domify.parse(dom); 
      // domify has been modified so that it could be used by the settingsEditor class
      // the modification doesn't expose domify as an alias for domify.parse() 
    }

    /**
    * Parse a markdown string to HTML string.
    * @returns A valid HTML string.
    */
    parseMarkdown(): string {
      return parsers.markdown.toHTML(this.__inner.text);
    }

    /**
    * Parse a Jade string to HTML string. <br>
    * Note that the support of Jade's features is basically limited to the syntactic sugars (no includes, no code...).
    * @returns A valid HTML string.
    */
    parseJade(): string {
      return parsers.jade.compile(this.__inner.text)();
    }

    parseStylus(): string {
      return "stylus";
    }
  }

}

(<any>window).fText = fText;
