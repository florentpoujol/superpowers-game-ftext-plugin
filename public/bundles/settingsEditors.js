(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FTextSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, serverData) {
        super(id, pub, FTextSettingsResource.schema, serverData);
    }
    init(callback) {
        let pub = {};
        for (let name in FTextSettingsResource.defaultValues) {
            pub[name] = FTextSettingsResource.defaultValues[name];
        }
        this.pub = pub;
        super.init(callback);
    }
}
FTextSettingsResource.schema = {
    styleActiveLine: { type: "boolean", mutable: true },
    showTrailingSpace: { type: "boolean", mutable: true },
    autoCloseBrackets: { type: "boolean", mutable: true },
    matchTags: { type: "boolean", mutable: true },
    highlightSelectionMatches: { type: "boolean", mutable: true },
    lint: { type: "boolean", mutable: true }
};
FTextSettingsResource.defaultValues = {
    styleActiveLine: true,
    autoCloseBrackets: true,
    showTrailingSpace: true,
    matchTags: true,
    highlightSelectionMatches: true,
    lint: true,
}; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...
exports.default = FTextSettingsResource;

},{}],2:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fTextSettingsResource_1 = require("../data/fTextSettingsResource");

const domify = require("domify");
class FTextSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.booleanFields = [];
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            for (let setting in resource.pub) {
                if (this.booleanFields.indexOf(setting) !== -1)
                    this.fields[setting].checked = resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
            }
        };
        this.onResourceEdited = (resourceId, command, setting) => {
            if (this.booleanFields.indexOf(setting) !== -1)
                this.fields[setting].checked = this.resource.pub[setting];
            else
                console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, this.resource.pub[setting]);
        };
        this.projectClient = projectClient;
        // build the form from the html file
        let html = "\r\n<div>\r\n  <p>\r\n    Check the documentation at <a href=\"https://github.com/florentpoujol/superpowers-game-ftext-plugin\" title=\"fText plugin documentation\">https://github.com/florentpoujol/superpowers-game-ftext-plugin</a> for more informations on the various settings you can find below.\r\n  </p>\r\n  <table>\r\n    <tr>\r\n      <th>Auto close brackets</th>\r\n      <td>\r\n        <input id=\"autoCloseBrackets\" type=\"checkbox\"/>\r\n      </td>\r\n    </tr>\r\n    <tr>\r\n      <th>Highlight</th>\r\n      <td>\r\n        <label>\r\n          <input id=\"styleActiveLine\" type=\"checkbox\"/>\r\n          active line\r\n        </label> <br>\r\n        <label>\r\n          <input id=\"showTrailingSpace\" type=\"checkbox\"/>\r\n          trailing spaces\r\n        </label> <br>\r\n        <label>\r\n          <input id=\"matchTags\" type=\"checkbox\"/>\r\n          matching tags (for HTML-like languages)\r\n        </label> <br>\r\n        <label>\r\n          <input id=\"highlightSelectionMatches\" type=\"checkbox\"/>\r\n          matching words (when selected)\r\n        </label>\r\n      </td>\r\n    </tr>\r\n    <tr>\r\n      <th>Linting</th>\r\n      <td>\r\n        <input id=\"lint\" type=\"checkbox\"/>\r\n      </td>\r\n    </tr>\r\n  </table>\r\n</div>\r\n";
        container.appendChild(domify(html));
        // ----------------------------------------
        // build booleand settings
        for (let setting in fTextSettingsResource_1.default.defaultValues) {
            let defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", (event) => {
                    this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, (err) => {
                        if (err != null) {
                            console.error(err);
                            new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close"));
                        }
                    });
                });
            }
        }
        this.projectClient.subResource("fTextSettings", this);
    }
}
exports.default = FTextSettingsEditor;

},{"../data/fTextSettingsResource":1,"domify":2}],4:[function(require,module,exports){
var FTextSettingsEditor = require("./FTextSettingsEditor");

SupClient.registerPlugin("settingsEditors", "fText", { namespace: "editors", editor: FTextSettingsEditor.default });

},{"./FTextSettingsEditor":3}]},{},[4]);
