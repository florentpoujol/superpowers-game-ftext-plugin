(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fTextSettingsEditor = require("./fTextSettingsEditor");

SupClient.registerSettingsEditorClass("fText", fTextSettingsEditor.default);

},{"./fTextSettingsEditor":5}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fTextSettingsResource = (function (_super) {
    __extends(fTextSettingsResource, _super);
    function fTextSettingsResource(pub, serverData) {
        _super.call(this, pub, fTextSettingsResource.schema, serverData);
    }
    fTextSettingsResource.prototype.init = function (callback) {
        var pub = {};
        for (var name_1 in fTextSettingsResource.defaultValues) {
            pub[name_1] = fTextSettingsResource.defaultValues[name_1];
        }
        this.pub = pub;
        _super.prototype.init.call(this, callback);
    };
    fTextSettingsResource.schema = {
        theme: { type: "string", mutable: true },
        indentUnit: { type: "number", min: 1, max: 8, mutable: true },
        keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
        styleActiveLine: { type: "boolean", mutable: true },
        showTrailingSpace: { type: "boolean", mutable: true },
        autoCloseBrackets: { type: "boolean", mutable: true },
        matchTags: { type: "boolean", mutable: true },
        highlightSelectionMatches: { type: "boolean", mutable: true },
    };
    fTextSettingsResource.defaultValues = {
        theme: "default",
        indentUnit: 2,
        keyMap: "sublime",
        styleActiveLine: true,
        autoCloseBrackets: true,
        showTrailingSpace: false,
        matchTags: true,
        highlightSelectionMatches: true,
    };
    return fTextSettingsResource;
})(SupCore.data.base.Resource);
exports.default = fTextSettingsResource;

},{}],4:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = {parse: parse};

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

},{}],5:[function(require,module,exports){
(function (process){
var fTextSettingsResource_1 = require("../data/fTextSettingsResource");

var domify = require("domify");
// definitions are index.d.ts
// IMPORTANT: domify has been modified so that the module expose an object that contains the parse function
// instead of exposing the function directly.
// Typescript wouldn't let met import the module and use it as a function at the same time.
var fTextSettingsEditor = (function () {
    function fTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.booleanFields = [];
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (_this.booleanFields.indexOf(setting) !== -1)
                    _this.fields[setting].checked = resource.pub[setting];
                else {
                    if (_this.fields[setting] != null)
                        _this.fields[setting].value = resource.pub[setting];
                    else
                        console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
                }
            }
        };
        this.onResourceEdited = function (resourceId, command, setting) {
            if (_this.booleanFields.indexOf(setting) !== -1)
                _this.fields[setting].checked = _this.resource.pub[setting];
            else {
                if (_this.fields[setting] != null)
                    _this.fields[setting].value = _this.resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, _this.resource.pub[setting]);
            }
        };
        this.projectClient = projectClient;
        // build the form from the html file
        var html = "<div><h2>Global editor Settings</h2><table><tr><th>Theme</th><td><select id=\"theme\"></select></td></tr><tr><th>Indent Unit</th><td> <input id=\"indentUnit\" type=\"number\" min=\"1\" max=\"8\" value=\"2\"/></td></tr><tr><th>Key map</th><td> <select id=\"keyMap\"><option value=\"sublime\">sublime</option><option value=\"vim\">vim</option><option value=\"emacs\">emacs</option></select></td></tr><tr><th>Auto close brackets</th><td> <input id=\"autoCloseBrackets\" type=\"checkbox\"/></td></tr><tr><th>Highlight active line</th><td> <input id=\"styleActiveLine\" type=\"checkbox\"/></td></tr><tr><th>Highlight trailing spaces</th><td> <input id=\"showTrailingSpace\" type=\"checkbox\"/></td></tr><tr><th>Highlight matching tag</th><td> <input id=\"matchTags\" type=\"checkbox\"/></td></tr><tr><th>Highlight matching words</th><td> <input id=\"highlightSelectionMatches\" type=\"checkbox\"/></td></tr></table></div>";
        container.appendChild(domify.parse(html));
        // register fields
        this.fields["theme"] = document.querySelector("#theme");
        // get list of all available themes
        process.nextTick(function(){(function (err, themes) {
    if (err)
        throw err;
    if (themes != null && themes.length > 0) {
        for (var i in themes) {
            var file = themes[i].replace('.css', '');
            var option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            _this.fields['theme'].appendChild(option);
        }
        _this.fields['theme'].addEventListener('change', function (event) {
            var theme = event.target.value !== '' ? event.target.value : 'default';
            _this.projectClient.socket.emit('edit:resources', 'fTextSettings', 'setProperty', 'theme', theme, function (err) {
                if (err != null)
                    alert(err);
            });
        });
    }
})(null,["3024-day.css","3024-night.css","ambiance-mobile.css","ambiance.css","base16-dark.css","base16-light.css","blackboard.css","cobalt.css","colorforth.css","default.css","eclipse.css","elegant.css","erlang-dark.css","lesser-dark.css","mbo.css","mdn-like.css","midnight.css","monokai.css","neat.css","neo.css","night.css","paraiso-dark.css","paraiso-light.css","pastel-on-dark.css","rubyblue.css","solarized.css","the-matrix.css","tomorrow-night-bright.css","tomorrow-night-eighties.css","twilight.css","vibrant-ink.css","xq-dark.css","xq-light.css","zenburn.css"])});
        this.fields["indentUnit"] = document.querySelector("#indentUnit");
        this.fields["indentUnit"].addEventListener("change", function (event) {
            var size = (event.target.value !== "") ? event.target.value : 2;
            // call onResourceEdited methods that have subscribed to resources via project client
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "indentUnit", parseInt(size), function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["keyMap"] = document.querySelector("#keyMap");
        this.fields["keyMap"].addEventListener("change", function (event) {
            var map = (event.target.value !== "") ? event.target.value : "sublime";
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "keyMap", map, function (err) { if (err != null)
                console.error(err); });
        });
        // ----------------------------------------
        // build booleand settings
        for (var setting in fTextSettingsResource_1.default.defaultValues) {
            var defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", function (event) {
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, function (err) { if (err != null)
                        console.error(err); });
                });
            }
        }
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;

}).call(this,require('_process'))
},{"../data/fTextSettingsResource":3,"_process":2,"domify":4}]},{},[1]);
