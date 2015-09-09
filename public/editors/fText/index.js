(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
        customTheme: { type: "string", mutable: true },
        tabSize: { type: "number", min: 1, max: 8, mutable: true },
        indentWithTabs: { type: "boolean", mutable: true },
        keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
        styleActiveLine: { type: "boolean", mutable: true },
        showTrailingSpace: { type: "boolean", mutable: true },
        autoCloseBrackets: { type: "boolean", mutable: true },
        matchTags: { type: "boolean", mutable: true },
        highlightSelectionMatches: { type: "boolean", mutable: true },
        lint_json: { type: "boolean", mutable: true },
        lint_cson: { type: "boolean", mutable: true },
        lint_javascript: { type: "boolean", mutable: true },
        lint_jade: { type: "boolean", mutable: true },
        lint_stylus: { type: "boolean", mutable: true },
        lint_css: { type: "boolean", mutable: true },
        lint_yaml: { type: "boolean", mutable: true },
    };
    fTextSettingsResource.defaultValues = {
        theme: "default",
        customTheme: "",
        tabSize: 2,
        indentWithTabs: true,
        keyMap: "sublime",
        styleActiveLine: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        matchTags: true,
        highlightSelectionMatches: true,
        lint_json: true,
        lint_cson: true,
        lint_javascript: true,
        lint_jade: true,
        lint_stylus: true,
        lint_css: true,
        lint_yaml: true,
    }; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...
    return fTextSettingsResource;
})(SupCore.data.base.Resource);
exports.default = fTextSettingsResource;

},{}],2:[function(require,module,exports){
require("./info");
require("./ui");
require("./network");

},{"./info":3,"./network":4,"./ui":5}],3:[function(require,module,exports){
var querystring = require("querystring");
var qs = querystring.parse(window.location.search.slice(1));
var info = { projectId: qs.project, assetId: qs.asset, line: qs.line, ch: qs.ch };
exports.default = info;

},{"querystring":8}],4:[function(require,module,exports){
var info_1 = require("./info");
var ui_1 = require("./ui");
var fTextSettingsResource_1 = require("../../data/fTextSettingsResource");
exports.data = {};
exports.socket;
// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()
// updates the editor when the resource is received or edited
// called from the resources handlers
function onfTextSettingsResourceUpdated() {
    if (ui_1.default.editor != null) {
        var pub = exports.data.fTextSettingsResourcePub;
        var defaultValues = fTextSettingsResource_1.default.defaultValues;
        var syntax = exports.data.assetSyntax;
        for (var optionName in defaultValues) {
            var optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
            // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl optionValue is always chosen.
            if (optionName === "indentWithTabs" || optionName === "tabSize" || optionName === "customTheme")
                continue;
            if (optionName.indexOf("lint_") === 0) {
                if (optionName === "lint_" + syntax)
                    allowLinting(optionValue);
                continue;
            }
            if (optionValue != ui_1.default.editor.codeMirrorInstance.getOption(optionName)) {
                if (optionName === "theme") {
                    if (optionValue === "custom")
                        optionValue = pub["customTheme"];
                    loadThemeStyle(optionValue);
                }
                ui_1.default.editor.codeMirrorInstance.setOption(optionName, optionValue);
            }
        }
    }
}
function loadThemeStyle(theme) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "codemirror-themes/" + theme + ".css";
    document.head.appendChild(link);
}
// used in assetHandlers/onAssetReceived() and onfTextSettingsResourceUpdated-)
function allowLinting(allow) {
    if (allow === void 0) { allow = true; }
    ui_1.default.editor.codeMirrorInstance.setOption("lint", allow);
    ui_1.default.isAssetLinted = allow;
    if (allow === false)
        ui_1.default.refreshErrors([]);
}
var resourceHandlers = {
    onResourceReceived: function (resourceId, resource) {
        exports.data.fTextSettingsResourcePub = resource.pub;
        onfTextSettingsResourceUpdated();
    },
    onResourceEdited: function (resourceId, command, propertyName) {
        onfTextSettingsResourceUpdated();
    }
};
// ----------------------------------------
// read the asset's content then return a list of instructions and their values
// used to populate data.localEditorSettings
// called from onAssetReceived()
function parseInstructions() {
    var regex = /\[ftext\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?\]/ig;
    var match;
    var text = ui_1.default.editor.codeMirrorInstance.getDoc().getValue();
    var instructionsCount = (text.match(/\[\s*ftext/ig) || []).length; // prevent infinite loop
    var instructions = {};
    do {
        match = regex.exec(text);
        if (match != null && match[1] != null) {
            var name_1 = match[1].trim().toLowerCase();
            var value = match[3];
            if (value != null)
                value = value.trim();
            else
                value = "";
            if (name_1 === "include") {
                if (instructions[name_1] == null)
                    instructions[name_1] = [];
                instructions[name_1].push(value);
            }
            else
                instructions[name_1] = value.trim().toLowerCase();
        }
        instructionsCount--;
    } while (match != null && instructionsCount > 0);
    return instructions;
}
// used in assetHandlers.onAssetEdited()
var onAssetCommands = {
    editText: function (operationData) {
        ui_1.default.hasDraft(true);
        ui_1.default.editor.receiveEditText(operationData);
    },
    saveText: function () {
        ui_1.default.hasDraft(false);
    }
};
var assetHandlers = {
    onAssetReceived: function (err, asset) {
        if (asset.id !== info_1.default.assetId)
            return;
        exports.data.asset = asset;
        // (<any>ui.errorPaneStatus.classList.toggle)("has-draft", data.asset.hasDraft);
        ui_1.default.hasDraft(exports.data.asset.hasDraft);
        ui_1.default.editor.setText(exports.data.asset.pub.draft);
        if (info_1.default.line != null && info_1.default.ch != null)
            ui_1.default.editor.codeMirrorInstance.getDoc().setCursor({ line: info_1.default.line, ch: info_1.default.ch });
        // fText specific settings :
        exports.data.assetInstructions = parseInstructions();
        // get asset syntax
        exports.data.assetSyntax = "";
        var _languagesByExtensions = {
            md: "markdown",
            styl: "stylus",
            js: "javascript",
            yml: "yaml",
        };
        var name = exports.data.projectClient.entries.getPathFromId(exports.data.asset.id);
        var match = name.match(/\.[a-zA-Z]+$/gi);
        if (match != null) {
            var syntax_1 = match[0].replace(".", "");
            if (_languagesByExtensions[syntax_1] != null)
                syntax_1 = _languagesByExtensions[syntax_1];
            exports.data.assetSyntax = syntax_1;
        }
        // set Codemirror's mode based on the asset's syntax
        var syntax = exports.data.assetSyntax;
        if (syntax != "") {
            var modesBySyntaxes = {
                cson: "coffeescript",
                html: "htmlmixed",
                json: "application/json",
                md: "markdown",
                shader: "x-shader/x-fragment",
            };
            var mode = modesBySyntaxes[syntax] || syntax;
            ui_1.default.editor.codeMirrorInstance.setOption("mode", mode);
        }
        if (fTextSettingsResource_1.default.defaultValues["lint_" + syntax] != null) {
            // always put the lint gutter, because adding or removing it on the fly mess the other gutters
            var gutters = ui_1.default.editor.codeMirrorInstance.getOption("gutters");
            gutters.unshift("CodeMirror-lint-markers");
            allowLinting(true); // this value may be modified when the resource is received, from onfTextSettingsUpdated()
        }
        exports.data.projectClient.subResource("fTextSettings", resourceHandlers);
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== info_1.default.assetId)
            return;
        if (onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== info_1.default.assetId)
            return;
        ui_1.default.editor.clear();
        SupClient.onAssetTrashed();
    },
};
// ----------------------------------------
var entriesHandlers = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "fText")
                return;
            exports.data.projectClient.subAsset(entry.id, "fText", assetHandlers);
        });
    },
};
// ----------------------------------------
function onWelcomed(clientId) {
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: true });
    exports.data.projectClient.subEntries(entriesHandlers);
    // data.projectClient.subResource("fTextSettings", resourceHandlers); // done in onAssetReceived()
    ui_1.default.setupEditor(clientId); // defined in ui.ts
}
// start
exports.socket = SupClient.connect(info_1.default.projectId);
exports.socket.on("welcome", onWelcomed);
exports.socket.on("disconnect", SupClient.onDisconnected);

},{"../../data/fTextSettingsResource":1,"./info":3,"./ui":5}],5:[function(require,module,exports){
var info_1 = require("./info");
var network_1 = require("./network");
var ui = {
    isAssetLinted: true
};
exports.default = ui;
SupClient.setupHotkeys();
window.addEventListener("message", function (event) {
    if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    if (event.data.line != null && event.data.ch != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line), ch: parseInt(event.data.ch) });
});
// Add a context menu on Right-Click when using NodeWebkit
var nwDispatcher = window.nwDispatcher;
if (nwDispatcher != null) {
    var gui = nwDispatcher.requireNwGui();
    var menu = new gui.Menu();
    menu.append(new gui.MenuItem({ label: "Cut (Ctrl-X)", click: function () { document.execCommand("cut"); } }));
    menu.append(new gui.MenuItem({ label: "Copy (Ctrl-C)", click: function () { document.execCommand("copy"); } }));
    menu.append(new gui.MenuItem({ label: "Paste (Ctrl-V)", click: function () { document.execCommand("paste"); } }));
    document.querySelector(".text-editor-container").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        menu.popup(event.screenX - gui.Window.get().x, event.screenY - gui.Window.get().y);
        return false;
    });
}
// called from network.ts/onWelcomed()
ui.setupEditor = function (clientId) {
    var textArea = document.querySelector(".text-editor");
    ui.editor = new fTextEditorWidget(network_1.data.projectClient, clientId, textArea, {
        mode: "",
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Cmd-Space": "autocomplete",
            "Cmd-J": "toMatchingTag",
            "Ctrl-J": "toMatchingTag"
        },
        editCallback: function (text, origin) { },
        sendOperationCallback: onSendOperation,
        saveCallback: onSaveText
    });
    ui.editor.codeMirrorInstance.setOption("matchTags", true);
    ui.editor.codeMirrorInstance.getOption("gutters").push("CodeMirror-foldgutter");
    ui.editor.codeMirrorInstance.setOption("foldGutter", true);
    // resfreshErrors() is called from codemirror-linters/lint.js to pass the number of errors
    ui.editor.codeMirrorInstance.refreshErrors = ui.refreshErrors;
};
function onSendOperation(operation) {
    network_1.socket.emit("edit:assets", info_1.default.assetId, "editText", operation, network_1.data.asset.document.getRevisionId(), function (err) { if (err != null) {
        alert(err);
        SupClient.onDisconnected();
    } });
}
function onSaveText() {
    network_1.socket.emit("edit:assets", info_1.default.assetId, "saveText", function (err) { if (err != null) {
        alert(err);
        SupClient.onDisconnected();
    } });
}
// ----------------------------------------
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".status");
ui.errorPaneStatus.addEventListener("click", onErrorPanelClick);
// has-draft added/removed from the onAssetCommands function in network.ts
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".errorInfo");
ui.refreshErrors = function (errors) {
    var text = "";
    if (errors == null || errors.length === 0) {
        ui.isAssetLinted === true ? text = "- No error" : text = "";
        ui.errorPaneInfo.textContent = text;
        ui.errorPaneStatus.classList.remove("has-errors");
    }
    else {
        ui.errorPaneInfo.textContent = "- " + errors.length + " error" + (errors.length > 1 ? "s - Click to jump to the first error" : " - Click to jump to the error");
        ui.errorPaneStatus.classList.add("has-errors");
        ui.errorPaneStatus.dataset.line = errors[0].from.line;
        ui.errorPaneStatus.dataset.character = errors[0].from.ch;
    }
};
function onErrorPanelClick(event) {
    if (ui.errorPaneStatus.classList.contains("has-errors") === false)
        return;
    var target = event.target;
    while (true) {
        if (target.tagName === "BUTTON")
            return;
        if (target === ui.errorPaneStatus)
            break;
        target = target.parentElement;
    }
    var line = target.dataset.line;
    var character = target.dataset.character;
    if (line != null) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line), ch: parseInt(character) });
        ui.editor.codeMirrorInstance.focus();
    }
}
// called from network.ts/assetCommands/editText() and savetext()
ui.hasDraft = function (hasDraft) {
    if (hasDraft === void 0) { hasDraft = true; }
    if (hasDraft === true) {
        ui.errorPaneStatus.classList.add("has-draft");
        ui.saveButton.textContent = "Save ";
        ui.saveButton.disabled = false;
    }
    else {
        ui.errorPaneStatus.classList.remove("has-draft");
        ui.saveButton.textContent = "Saved";
        ui.saveButton.disabled = true;
    }
};
// Save button
ui.saveButton = ui.errorPane.querySelector(".draft button");
ui.saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    onSaveText();
});

},{"./info":3,"./network":4}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],8:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":6,"./encode":7}]},{},[2]);
