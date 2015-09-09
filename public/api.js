(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


SupAPI.registerPlugin("typescript", "fText", {
  code: "/// <reference path=\"Sup.d.ts\"/>\r\n\r\nclass fText extends Sup.Asset {\r\n\r\n  /**\r\n  * Holds the following parsers :<br>\r\n  * - https://github.com/zaach/jsonlint <br>\r\n  * - https://github.com/groupon/cson-parser<br>\r\n  * - https://github.com/component/domify<br>\r\n  * - https://github.com/evilstreak/markdown-js<br>\r\n  * - https://github.com/jadejs/jade<br>\r\n  * - https://github.com/stylus/stylus<br>\r\n  * - https://github.com/nodeca/js-yaml\r\n  */\r\n  static parsers: {\r\n    jsonlint: any,\r\n    csonparser: any,\r\n    domify: (text: string)=>any,\r\n    markdown: any,\r\n    jade: any,\r\n    stylus: any,\r\n    jsyaml: any\r\n  } = (<any>window).fTextParsers;\r\n  // (<any>window).fTextParsers is set in rutime/ftext.ts\r\n\r\n  /**\r\n  * The set of instructions which can be found in the asset's content.\r\n  */\r\n  instructions: { [key: string]: string|string[] } = {};\r\n\r\n  /**\r\n  * The asset's syntax, defined by the extension (if any) found at the end of its name.\r\n  */\r\n  syntax: string = \"\";\r\n\r\n  // ----------------------------------------\r\n\r\n  // called from runtime createdOuterAsset(), or by hand\r\n  // inner is the asset's pub as defined in the asset's class\r\n  /**\r\n  * @param inner - The asset's pub as defined in the asset's class.\r\n  */\r\n  constructor(inner: {[key:string]: any;}) {\r\n    super(inner); // sets inner as the value of this.__inner\r\n\r\n    this._parseInstructions();\r\n\r\n    // get asset's syntax\r\n    let _languagesByExtensions: any = {\r\n      md: \"markdown\",\r\n      styl: \"stylus\",\r\n      js: \"javascript\",\r\n      yml: \"yaml\",\r\n    };\r\n    let name = this.__inner.name; // 06/09/15 where does this.__inner.name come from ? is it the path ?\r\n    // it comes from the runtime loadAsset() where entry\r\n    let match = name.match(/\\.[a-zA-Z]+$/gi); // look for any letter after a dot at the end of the string\r\n    if (match != null) {\r\n      let syntax = match[0].replace(\".\", \"\");\r\n      if (_languagesByExtensions[syntax] != null)\r\n        syntax = _languagesByExtensions[syntax];\r\n      this.syntax = syntax;\r\n    }\r\n  }\r\n\r\n  /**\r\n  * Read the [ftext: instruction: value] instructions in the asset's text\r\n  * then build the this.instructions object.\r\n  * Called once from the constructor\r\n  */\r\n  private _parseInstructions() {\r\n    let regex = /\\[ftext\\s*:\\s*([a-zA-Z0-9\\/+-]+)(\\s*:\\s*([a-zA-Z0-9\\.\\/+-]+))?\\]/ig\r\n    let match: any;\r\n    let instructionsCount = (this.__inner.text.match(/\\[\\s*ftext/ig) || []).length; // prevent infinite loop\r\n    do {\r\n      match = regex.exec(this.__inner.text);\r\n      if (match != null && match[1] != null) {\r\n        let name = match[1].trim().toLowerCase();\r\n        let value = match[3];\r\n        if (value != null) value = value.trim();\r\n        else value = \"\";\r\n        if (name === \"include\") {\r\n          if (this.instructions[name] == null) this.instructions[name] = [];\r\n          (<string[]>this.instructions[name]).push(value);\r\n        }\r\n        else\r\n          this.instructions[name] = value.trim().toLowerCase();\r\n      }\r\n      instructionsCount--;\r\n    }\r\n    while (match != null && instructionsCount > 0);\r\n  }\r\n\r\n  // ----------------------------------------\r\n\r\n  /**\r\n  * @readonly\r\n  * The raw content of the asset.\r\n  */\r\n  get text(): string {\r\n    return this.__inner.text;\r\n  }\r\n\r\n  // ----------------------------------------\r\n\r\n  /**\r\n  * Returns the content of the asset, after having parsed and processed it\r\n  * @param options - An object with options.\r\n  * @return JavaScript or DOM object, or string.\r\n  */\r\n  parse(options?: { include?: boolean }): any {\r\n    options = options || {};\r\n    let syntax = this.syntax;\r\n\r\n    let parseFn = (text?: string): string => {\r\n      if (text == null)\r\n        text = this.__inner.text;\r\n\r\n      let syntaxFn: Function;\r\n      switch (syntax) {\r\n        case \"json\":\r\n          syntaxFn = fText.parsers.jsonlint.parse;\r\n          break;\r\n        case \"cson\":\r\n          syntaxFn = fText.parsers.csonparser.parse;\r\n          break;\r\n        case \"html\":\r\n          syntaxFn = fText.parsers.domify;\r\n          break;\r\n        case \"markdown\":\r\n          syntaxFn = fText.parsers.markdown.toHTML;\r\n          break;\r\n        case \"jade\":\r\n          syntaxFn = fText.parsers.jade.compile(text);\r\n          break;\r\n        case \"stylus\": \r\n          syntaxFn = ()=>{}; // special case\r\n          break;\r\n        case \"yaml\": \r\n          syntaxFn = fText.parsers.jsyaml.safeLoad;\r\n          break;\r\n      }\r\n      \r\n      if (syntaxFn != null) {\r\n        try {\r\n          if (syntax === \"stylus\")\r\n            text = fText.parsers.stylus(text).set(\"imports\", []).render();\r\n          else\r\n            text = syntaxFn(text);\r\n        }\r\n        catch (e) {\r\n          console.error(\"fText.parse(): error parsing asset '\"+this.__inner.name+\"' :\");\r\n          throw e;\r\n        }\r\n      }\r\n      return text;\r\n    };\r\n\r\n    let includeFn = (text?: string): string => {\r\n      if (text == null)\r\n        text = this.__inner.text;\r\n\r\n      if (this.instructions[\"include\"] != null) {\r\n        for (let path of this.instructions[\"include\"]) {\r\n          // console.log(\"fTextAsset.text path\", path);\r\n          let asset = Sup.get(path, fText, {ignoreMissing: false});\r\n          // note: for some reason, the three arguments are needed here\r\n          let regexp = new RegExp(\"[<!/*#-]*\\\\[ftext\\\\s*:\\\\s*include\\\\s*:\\\\s*\"+path.replace(\".\", \"\\\\.\")+\"\\\\][>*/-]*\", \"i\");\r\n          text = text.replace(regexp, asset.parse(options));\r\n        }\r\n      }\r\n      else if (options.include === true)\r\n        console.log(\"fText.parse(): Nothing to include for asset\", this.__inner.name);\r\n\r\n      return text;\r\n    };\r\n\r\n    if (options.include === false)\r\n      return parseFn();\r\n    else {\r\n      if (syntax === \"html\" || syntax === \"json\" || syntax === \"cson\" || syntax === \"yaml\") {\r\n        return parseFn(includeFn());\r\n      }\r\n      else\r\n        return includeFn(parseFn());\r\n    }\r\n  }\r\n}\r\n\r\n(<any>window).fText = fText;\r\n".replace("<reference path=", ""),
  defs: "// fTextAsset plugin\r\n// https://github.com/florentpoujol/superpowers-ftext-plugin\r\n// Adds a generic text asset of type fText\r\n\r\n// Documentation:\r\n// https://florentpoujol.github.io/superpowers-ftext-plugin\r\n\r\n// You can also access the documentation offline in the plugin's \"public/docs\" folder \r\n// or via the \"Docs browser\" tool provided by the \"Docs browser\" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin\r\n\r\ndeclare class fText extends Sup.Asset {\r\n  constructor(inner: {[key:string]: any;});\r\n  \r\n  static parsers: {\r\n    jsonlint: any,                // https://github.com/zaach/jsonlint\r\n    csonparser: any,              // https://github.com/groupon/cson-parser\r\n    domify: (text: string)=>any,  // https://github.com/component/domify\r\n    markdown: any,                // https://github.com/evilstreak/markdown-js\r\n    jade: any,                    // https://github.com/jadejs/jade\r\n    stylus: any,                  // https://github.com/stylus/stylus\r\n    jsyaml: any,                  // https://github.com/nodeca/js-yaml\r\n  };\r\n\r\n  instructions: { [key: string]: string|string[] };\r\n  syntax: string;\r\n\r\n  text: string; // get raw content, readonly\r\n\r\n  parse(options?: {\r\n    include?: boolean,\r\n  }): any;\r\n}\r\n",
});

},{}]},{},[1]);
