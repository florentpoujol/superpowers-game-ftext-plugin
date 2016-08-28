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
