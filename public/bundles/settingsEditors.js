(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FTextSettingsResource = (function (_super) {
    __extends(FTextSettingsResource, _super);
    function FTextSettingsResource(id, pub, serverData) {
        _super.call(this, id, pub, FTextSettingsResource.schema, serverData);
    }
    FTextSettingsResource.prototype.init = function (callback) {
        var pub = {};
        for (var name_1 in FTextSettingsResource.defaultValues) {
            pub[name_1] = FTextSettingsResource.defaultValues[name_1];
        }
        this.pub = pub;
        _super.prototype.init.call(this, callback);
    };
    FTextSettingsResource.schema = {
        styleActiveLine: { type: "boolean", mutable: true },
        showTrailingSpace: { type: "boolean", mutable: true },
        autoCloseBrackets: { type: "boolean", mutable: true },
        matchTags: { type: "boolean", mutable: true },
        highlightSelectionMatches: { type: "boolean", mutable: true },
    };
    FTextSettingsResource.defaultValues = {
        styleActiveLine: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        matchTags: true,
        highlightSelectionMatches: true,
    }; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...
    return FTextSettingsResource;
}(SupCore.Data.Base.Resource));
Object.defineProperty(exports, "__esModule", { value: true });
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
var fTextSettingsResource_1 = require("../data/fTextSettingsResource");

var domify = require("domify");
var FTextSettingsEditor = (function () {
    function FTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.booleanFields = [];
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (_this.booleanFields.indexOf(setting) !== -1)
                    _this.fields[setting].checked = resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
            }
        };
        this.onResourceEdited = function (resourceId, command, setting) {
            if (_this.booleanFields.indexOf(setting) !== -1)
                _this.fields[setting].checked = _this.resource.pub[setting];
            else
                console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, _this.resource.pub[setting]);
        };
        this.projectClient = projectClient;
        // build the form from the html file
        var html = "\n<div>\n  <p>\n    Check the documentation at <a href=\"https://github.com/florentpoujol/superpowers-game-ftext-plugin\" title=\"fText plugin documentation\">https://github.com/florentpoujol/superpowers-game-ftext-plugin</a> for more informations on the various settings you can find below.\n  </p>\n  <table>\n    <tr>\n      <th>Auto close brackets</th>\n      <td>\n        <input id=\"autoCloseBrackets\" type=\"checkbox\"/>\n      </td>\n    </tr>\n    <tr>\n      <th>Highlight</th>\n      <td>\n        <label>\n          <input id=\"styleActiveLine\" type=\"checkbox\"/>\n          active line\n        </label> <br>\n        <label>\n          <input id=\"showTrailingSpace\" type=\"checkbox\"/>\n          trailing spaces\n        </label> <br>\n        <label>\n          <input id=\"matchTags\" type=\"checkbox\"/>\n          matching tags (for HTML-like languages)\n        </label> <br>\n        <label>\n          <input id=\"highlightSelectionMatches\" type=\"checkbox\"/>\n          matching words (when selected)\n        </label>\n      </td>\n    </tr>\n    <!-- <tr>\n      <th>Linting</th>\n      <td>\n        <input id=\"lint\" type=\"checkbox\"/>\n      </td>\n    </tr> -->\n  </table>\n</div>\n";
        container.appendChild(domify(html));
        // ----------------------------------------
        // build booleand settings
        for (var setting in fTextSettingsResource_1.default.defaultValues) {
            var defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", function (event) {
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, function (err) {
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
    return FTextSettingsEditor;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FTextSettingsEditor;

},{"../data/fTextSettingsResource":1,"domify":2}],4:[function(require,module,exports){
var FTextSettingsEditor = require("./FTextSettingsEditor");

SupClient.registerPlugin("settingsEditors", "fText", { namespace: "editors", editor: FTextSettingsEditor.default });

},{"./FTextSettingsEditor":3}]},{},[4]);
