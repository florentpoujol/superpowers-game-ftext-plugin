/// <reference path="Sup.d.ts"/>

/* tslint:disable:class-name */
class fText extends Sup.Asset {

  /**
  * Holds the following parsers :<br>
  * - https://github.com/zaach/jsonlint <br>
  * - https://github.com/groupon/cson-parser<br>
  * - https://github.com/component/domify<br>
  * - https://github.com/evilstreak/markdown-js<br>
  * - https://github.com/stylus/stylus<br>
  * - https://github.com/nodeca/js-yaml
  */
  static parsers: {
    jsonlint: any,
    csonparser: any,
    domify: (text: string) => any,
    markdown: any,
    pug: any,
    stylus: any,
    jsyaml: any
  } = (window as any).fTextParsers;
  // (window as any).fTextParsers is set in runtime/fText.ts

  /**
  * The set of instructions which can be found in the asset's content.
  */
  private instructions: { [key: string]: string|string[] } = {};

  /**
  * The asset's extension (if any) found at the end of its name.
  */
  private extension: string = "";

  // ----------------------------------------

  // called from runtime createdOuterAsset(), or by hand
  // inner is the asset's pub as defined in the asset's class
  /**
  * @param inner - The asset's pub as defined in the asset's class.
  */
  constructor(inner: {[key : string]: any; }) {
    super(inner); // sets inner as the value of this.__inner

    this._parseInstructions();

    // get asset's extension
    let assetName = this.__inner.name; // 06/09/15 where does this.__inner.name come from ? is it the path ?  it comes from the runtime loadAsset() where entry
    let extensionMatches = assetName.match(/\.[a-zA-Z]+$/gi); // look for any letter after a dot at the end of the string
    if (extensionMatches != null)
      this.extension = extensionMatches[0].replace(".", "");
  }

  /**
  * Read the [ftext: instruction: value] instructions in the asset's text
  * then build the this.instructions object.
  * Called once from the constructor
  */
  private _parseInstructions() {
    let regex = /ftext:([a-zA-Z0-9\/+-]+)(:([a-zA-Z0-9\.\/+-]+))?/ig;
    let match: any;
    let instructionsCount = (this.__inner.text.match(/ftext/ig) || []).length; // prevent infinite loop
    do {
      match = regex.exec(this.__inner.text);
      if (match != null && match[1] != null) {
        let name = match[1].trim().toLowerCase();
        let value = match[3];
        if (value != null) value = value.trim();
        else value = "";
        if (name === "include") {
          if (this.instructions[name] == null) this.instructions[name] = [];
          (this.instructions[name] as string[]).push(value);
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
  * Gets the raw content of the asset.
  */
  getText(): string {
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
    let extension = this.extension;

    let parseFn = (text?: string): string => {
      if (text == null)
        text = this.__inner.text;

      let parseFn: Function;
      switch (extension) {
        case "json":
          parseFn = fText.parsers.jsonlint.parse;
          break;
        case "cson":
          parseFn = fText.parsers.csonparser.parse;
          break;
        case "html":
          parseFn = fText.parsers.domify;
          break;
        case "md":
          parseFn = fText.parsers.markdown.toHTML;
          break;
        case "pug":
          parseFn = fText.parsers.pug.compile(text);
          break;
        case "styl":
          parseFn = () => { return; }; // special case
          break;
        case "yml":
          parseFn = fText.parsers.jsyaml.safeLoad;
          break;
      }

      if (parseFn != null) {
        try {
          if (extension === "styl")
            text = fText.parsers.stylus(text).set("imports", []).render();
          else
            text = parseFn(text);
        }
        catch (e) {
          console.error("fText.parse(): error parsing asset '" + this.__inner.name + "' :");
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
          let asset = Sup.get(path, fText, {ignoreMissing: false}); // note: for some reason, the three arguments are needed here
          let regexp = new RegExp("[<!/*#-]*ftext:include:" + path.replace(".", "\\.") + "[>*/-]*", "i");
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
      if (extension === "html" || extension === "json" || extension === "cson" || extension === "yml") {
        return parseFn(includeFn());
      }
      else
        return includeFn(parseFn());
    }
  }
}

(window as any).fText = fText;
