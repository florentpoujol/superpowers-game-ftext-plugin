(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":1,"./encode":2}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
"use strict";
require("./ui");
require("./network");

},{"./network":6,"./ui":7}],6:[function(require,module,exports){
"use strict";
var querystring = require("querystring");
var ui_1 = require("./ui");
var fTextSettingsResource_1 = require("../../data/fTextSettingsResource");
exports.data = {};
SupClient.i18n.load([{ root: window.location.pathname + "/../..", name: "fTextEditor" }], function () {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("welcome", onWelcomed);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()
// used in assetSubscriber.onAssetReceive() when subscribing to the resource
var resourceSubscriber = {
    onResourceReceived: function (resourceId, resource) {
        exports.data.FTextSettingsResourcePub = resource.pub;
        onFTextSettingsResourceUpdated();
    },
    onResourceEdited: function (resourceId, command, propertyName) {
        onFTextSettingsResourceUpdated();
    }
};
// updates the editor (when open) when the resource is received or edited
// called from the resources handlers
function onFTextSettingsResourceUpdated() {
    if (ui_1.default.editor != null) {
        var pub = exports.data.FTextSettingsResourcePub;
        var defaultValues = fTextSettingsResource_1.default.defaultValues;
        // const syntax: string = data.assetSyntax;
        for (var optionName in defaultValues) {
            var optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
            // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl optionValue is always chosen.
            if (optionValue !== ui_1.default.editor.codeMirrorInstance.getOption(optionName)) {
                if (optionName === "lint") {
                    optionValue = false; // quick fix while linting feature are being reimplemented
                    allowLinting(optionValue);
                }
                ui_1.default.editor.codeMirrorInstance.setOption(optionName, optionValue);
            }
        }
    }
}
// used in assetSubscriber.onAssetReceived() and onFTextSettingsResourceUpdated()
function allowLinting(allow) {
    if (allow === void 0) { allow = true; }
    // ui.isAssetLinted = false; // quick fix while linting feature are being reimplemented
    ui_1.default.isAssetLinted = allow;
    if (allow === false)
        ui_1.default.refreshErrors([]);
}
// ----------------------------------------
// used in assetSubscriber.onAssetEdited()
var onAssetCommands = {
    editText: function (operationData) {
        ui_1.default.hasDraft(true);
        ui_1.default.editor.receiveEditText(operationData);
    },
    applyDraftChanges: function () {
        ui_1.default.hasDraft(false);
    }
};
// ----------------------------------------
var assetSubscriber = {
    onAssetReceived: function (id, asset) {
        if (id !== SupClient.query.asset)
            return;
        exports.data.asset = asset;
        ui_1.default.hasDraft(asset.hasDraft);
        ui_1.default.editor.setText(asset.pub.draft);
        var qs = querystring.parse(window.location.search.slice(1));
        var info = { line: qs.line, ch: qs.ch };
        if (info.line != null && info.ch != null) {
            ui_1.default.editor.codeMirrorInstance.getDoc().setCursor({ line: info.line, ch: info.ch });
            console.log("set cursor", window.location.search, qs);
        }
        // ----------
        // fText specific settings :
        // read the asset's content then return a list of instructions and their values
        // used to populate data.localEditorSettings
        // called from onAssetReceived()
        /*const parseInstructions = () => {
          let regex = /ftext:([a-zA-Z0-9\/+-]+)(:([a-zA-Z0-9\.\/+-]+))?\]/ig;
          let match: any;
          let text = ui.editor.codeMirrorInstance.getDoc().getValue();
          let instructionsCount = (text.match(/\[\s*ftext/ig) || []).length; // prevent infinite loop
          let instructions: any = {};
          do {
            match = regex.exec(text);
            if (match != null && match[1] != null) {
              let name = match[1].trim().toLowerCase();
              let value = match[3];
              if (value != null) value = value.trim();
              else value = "";
              if (name === "include") {
                if (instructions[name] == null) instructions[name] = [];
                (instructions[name] as string[]).push(value);
              }
              else
                instructions[name] = value.trim().toLowerCase();
            }
            instructionsCount--;
          }
          while (match != null && instructionsCount > 0);
          return instructions;
        };
    
        // where the hell is it used ?
        data.assetInstructions = parseInstructions();*/
        // get asset syntax
        exports.data.assetSyntax = "";
        var syntaxesByShortExtensions = {
            md: "markdown",
            styl: "stylus",
            js: "javascript",
            yml: "yaml",
        };
        var assetPath = exports.data.projectClient.entries.getPathFromId(asset.id);
        // check for an extension at the end of the asset's path
        var extensionMatches = assetPath.match(/\.[a-zA-Z]+$/gi);
        if (extensionMatches != null) {
            var syntax_1 = extensionMatches[0].replace(".", "");
            if (syntaxesByShortExtensions[syntax_1] != null)
                syntax_1 = syntaxesByShortExtensions[syntax_1];
            exports.data.assetSyntax = syntax_1;
        }
        // set Codemirror's mode based on the asset's syntax
        var syntax = exports.data.assetSyntax;
        if (syntax !== "") {
            var modesBySyntaxes = {
                cson: "coffeescript",
                html: "htmlmixed",
                json: "application/json",
                shader: "x-shader/x-fragment",
            };
            var mode = modesBySyntaxes[syntax] || syntax;
            ui_1.default.editor.codeMirrorInstance.setOption("mode", mode);
        }
        // if (FTextSettingsResource.defaultValues["lint_" + syntax] != null) {
        // always put the lint gutter, because adding or removing it on the fly mess the other gutters
        // const gutters = ui.editor.codeMirrorInstance.getOption("gutters");
        // gutters.unshift("CodeMirror-lint-markers");
        allowLinting(true); // this value may be modified when the resource is received, from onfTextSettingsUpdated()
        // this mostly sets is asset linted
        // }
        exports.data.projectClient.subResource("fTextSettings", resourceSubscriber);
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== SupClient.query.asset)
            return;
        if (onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        SupClient.onAssetTrashed();
    },
};
// ----------------------------------------
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "fText")
                return;
            exports.data.projectClient.subAsset(entry.id, "fText", assetSubscriber);
        });
    },
};
// ----------------------------------------
// called when the socket "welcome" event is emitted
function onWelcomed(clientId) {
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: true });
    exports.data.projectClient.subEntries(entriesSubscriber);
    // data.projectClient.subResource("FTextSettings", resourceSubscriber); // done in onAssetReceived()
    ui_1.default.setupEditor(clientId);
}

},{"../../data/fTextSettingsResource":4,"./ui":7,"querystring":3}],7:[function(require,module,exports){
"use strict";
var network_1 = require("./network");
var ui = {
    isAssetLinted: true
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// focus the editor
window.addEventListener("message", function (event) {
    if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    if (event.data.line != null && event.data.ch != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line, 10), ch: parseInt(event.data.ch, 10) });
});
// Add a context menu on Right-Click when using NodeWebkit
var nwDispatcher = window.nwDispatcher;
if (nwDispatcher != null) {
    var gui_1 = nwDispatcher.requireNwGui();
    var menu_1 = new gui_1.Menu();
    menu_1.append(new gui_1.MenuItem({ label: "Cut (Ctrl-X)", click: function () { document.execCommand("cut"); } }));
    menu_1.append(new gui_1.MenuItem({ label: "Copy (Ctrl-C)", click: function () { document.execCommand("copy"); } }));
    menu_1.append(new gui_1.MenuItem({ label: "Paste (Ctrl-V)", click: function () { document.execCommand("paste"); } }));
    document.querySelector(".text-editor-container").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        menu_1.popup(event.screenX - gui_1.Window.get().x, event.screenY - gui_1.Window.get().y);
        return false;
    });
}
// called from network.ts/onWelcomed()
ui.setupEditor = function (clientId) {
    var textArea = document.querySelector(".text-editor");
    ui.editor = new TextEditorWidget(network_1.data.projectClient, clientId, textArea, {
        mode: "",
        extraKeys: {
            "Ctrl-S": function () { applyDraftChanges(); },
            "Cmd-S": function () { applyDraftChanges(); },
            "Ctrl-Space": "autocomplete",
            "Cmd-Space": "autocomplete",
            "Cmd-J": "toMatchingTag",
            "Ctrl-J": "toMatchingTag"
        },
        editCallback: function (text, origin) { return; },
        sendOperationCallback: function (operation) {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "editText", operation, network_1.data.asset.document.getRevisionId(), function (err) {
                if (err != null) {
                    new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close"));
                    SupClient.onDisconnected();
                }
            });
        }
    });
    // ui.editor.codeMirrorInstance.setOption("matchTags", true);
    // resfreshErrors() is called from codemirror-linters/lint.js to pass the number of errors
    ui.editor.codeMirrorInstance.refreshErrors = ui.refreshErrors;
};
// ----------------------------------------
// Error pane
ui.errorPane = document.querySelector(".error-pane");
// the top bar of the error pane with the save button
// can have the has-draft class - sets from the onAssetCommands functions in network.ts
// can have the has-errors class - sets in ui.refreshErrors()
ui.errorPaneStatus = ui.errorPane.querySelector(".status");
// capture the click event on the whole error pane when it's open
// to set the cursor on the clicked error
ui.errorPaneStatus.addEventListener("click", function (event) {
    if (ui.errorPaneStatus.classList.contains("has-errors") === false)
        return;
    var line = ui.errorPaneStatus.dataset.line;
    var character = ui.errorPaneStatus.dataset.character;
    if (line != null) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
        ui.editor.codeMirrorInstance.focus();
    }
});
// the part of the errorPaneStatus with the text
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".errorInfo");
// a reference of this function is set to  ui.editor.codeMirrorInstance.refreshErrors
// so that it can be called from Codemirror's linters
ui.refreshErrors = function (errors) {
    var text = "";
    if (errors == null || errors.length === 0) {
        ui.isAssetLinted === true ? text = "- " + SupClient.i18n.t("fTextEditor:noError") : text = "";
        ui.errorPaneInfo.textContent = text;
        ui.errorPaneStatus.classList.remove("has-errors");
    }
    else {
        text = " - " + errors.length;
        if (errors.length > 1)
            text += " " + SupClient.i18n.t("fTextEditor:errors") + " - " + SupClient.i18n.t("fTextEditor:clickToFirstError");
        else
            text += " " + SupClient.i18n.t("fTextEditor:error") + " - " + SupClient.i18n.t("fTextEditor:clickToError");
        ui.errorPaneInfo.textContent = text;
        ui.errorPaneStatus.classList.add("has-errors");
        ui.errorPaneStatus.dataset.line = errors[0].from.line;
        ui.errorPaneStatus.dataset.character = errors[0].from.ch;
    }
};
// called from network.ts/assetCommands/editText() and savetext()
ui.hasDraft = function (hasDraft) {
    if (hasDraft === void 0) { hasDraft = true; }
    if (hasDraft === true) {
        ui.errorPaneStatus.classList.add("has-draft");
        ui.saveButton.textContent = SupClient.i18n.t("fTextEditor:save");
        ui.saveButton.disabled = false;
    }
    else {
        ui.errorPaneStatus.classList.remove("has-draft");
        ui.saveButton.textContent = SupClient.i18n.t("fTextEditor:saved");
        ui.saveButton.disabled = true;
    }
};
// Save
// also called when clicking Ctrl+S or the save button
function applyDraftChanges() {
    network_1.data.projectClient.editAssetNoErrorHandling(SupClient.query.asset, "applyDraftChanges", {}, function (err) {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(err);
            SupClient.onDisconnected();
        }
    });
    // no need to call ui.hasDraft(false) since its done in the assetCommands functions
}
ui.saveButton = ui.errorPane.querySelector(".error-pane button");
ui.saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    applyDraftChanges();
});

},{"./network":6}]},{},[5]);
