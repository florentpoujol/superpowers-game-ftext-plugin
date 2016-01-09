/// <reference path="Sup.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fText = (function (_super) {
    __extends(fText, _super);
    // ----------------------------------------
    // called from runtime createdOuterAsset(), or by hand
    // inner is the asset's pub as defined in the asset's class
    /**
    * @param inner - The asset's pub as defined in the asset's class.
    */
    function fText(inner) {
        _super.call(this, inner); // sets inner as the value of this.__inner
        // (<any>window).fTextParsers is set in rutime/ftext.ts
        /**
        * The set of instructions which can be found in the asset's content.
        */
        this.instructions = {};
        /**
        * The asset's syntax, defined by the extension (if any) found at the end of its name.
        */
        this.syntax = "";
        this._parseInstructions();
        // get asset's syntax
        var _languagesByExtensions = {
            md: "markdown",
            styl: "stylus",
            js: "javascript",
            yml: "yaml",
        };
        var name = this.__inner.name; // 06/09/15 where does this.__inner.name come from ? is it the path ?
        // it comes from the runtime loadAsset() where entry
        var match = name.match(/\.[a-zA-Z]+$/gi); // look for any letter after a dot at the end of the string
        if (match != null) {
            var syntax = match[0].replace(".", "");
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
    fText.prototype._parseInstructions = function () {
        var regex = /\[ftext\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?\]/ig;
        var match;
        var instructionsCount = (this.__inner.text.match(/\[\s*ftext/ig) || []).length; // prevent infinite loop
        do {
            match = regex.exec(this.__inner.text);
            if (match != null && match[1] != null) {
                var name_1 = match[1].trim().toLowerCase();
                var value = match[3];
                if (value != null)
                    value = value.trim();
                else
                    value = "";
                if (name_1 === "include") {
                    if (this.instructions[name_1] == null)
                        this.instructions[name_1] = [];
                    this.instructions[name_1].push(value);
                }
                else
                    this.instructions[name_1] = value.trim().toLowerCase();
            }
            instructionsCount--;
        } while (match != null && instructionsCount > 0);
    };
    Object.defineProperty(fText.prototype, "text", {
        // ----------------------------------------
        /**
        * @readonly
        * The raw content of the asset.
        */
        get: function () {
            return this.__inner.text;
        },
        enumerable: true,
        configurable: true
    });
    // ----------------------------------------
    /**
    * Returns the content of the asset, after having parsed and processed it
    * @param options - An object with options.
    * @return JavaScript or DOM object, or string.
    */
    fText.prototype.parse = function (options) {
        var _this = this;
        options = options || {};
        var syntax = this.syntax;
        var parseFn = function (text) {
            if (text == null)
                text = _this.__inner.text;
            var syntaxFn;
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
                    syntaxFn = function () { }; // special case
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
                    console.error("fText.parse(): error parsing asset '" + _this.__inner.name + "' :");
                    throw e;
                }
            }
            return text;
        };
        var includeFn = function (text) {
            if (text == null)
                text = _this.__inner.text;
            if (_this.instructions["include"] != null) {
                for (var _i = 0, _a = _this.instructions["include"]; _i < _a.length; _i++) {
                    var path = _a[_i];
                    // console.log("fTextAsset.text path", path);
                    var asset = Sup.get(path, fText, { ignoreMissing: false });
                    // note: for some reason, the three arguments are needed here
                    var regexp = new RegExp("[<!/*#-]*\\[ftext\\s*:\\s*include\\s*:\\s*" + path.replace(".", "\\.") + "\\][>*/-]*", "i");
                    text = text.replace(regexp, asset.parse(options));
                }
            }
            else if (options.include === true)
                console.log("fText.parse(): Nothing to include for asset", _this.__inner.name);
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
    };
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
    fText.parsers = window.fTextParsers;
    return fText;
})(Sup.Asset);
window.fText = fText;
