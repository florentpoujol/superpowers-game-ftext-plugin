"use strict";
// import * as querystring from "querystring";
var ui_1 = require("./ui");
var fTextSettingsResource_1 = require("../../data/fTextSettingsResource");
/* tslint:disable */
// expose the linter, used int he custom linters script
window.consparser = require("coffee-script"); // used to parse CSON. Neither https://github.com/groupon/cson-parser nor https://github.com/bevry/cson
window.CSSLint = require("csslint").CSSLint;
window.JSHINT = require("jshint").JSHINT;
window.jsonlint = require("jsonlint");
window.pug = require("pug");
window.stylus = require("stylus");
window.jsyaml = require("js-yaml");
var data = {
    lintedModes: ["coffeescript" /* cson */, "application/json", "javascript", "css", "pug", "stylus", "yaml"],
    modesByExtensions: {
        "cson": "coffeescript",
        "json": "application/json",
        "js": "javascript",
        "styl": "stylus",
        "yml": "yaml",
        "md": "markdown",
        "shader": "x-shader/x-fragment",
        "html": "htmlmixed"
    },
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = data;
var socket;
SupClient.i18n.load([{ root: window.location.pathname + "/../..", name: "fTextEditor" }], function () {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("welcome", onWelcomed);
    socket.on("disconnect", SupClient.onDisconnected);
});
// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()
// used in assetSubscriber.onAssetReceive() when subscribing to the resource
var resourceSubscriber = {
    onResourceReceived: function (resourceId, resource) {
        // I suppose the resource is always received after the asset since the resource is subscribed at the end of onAssetreceived()
        data.FTextSettingsResourcePub = resource.pub;
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
        var pub = data.FTextSettingsResourcePub;
        var defaultValues = fTextSettingsResource_1.default.defaultValues;
        for (var optionName in defaultValues) {
            var optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
            // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl optionValue is always chosen.
            if (optionValue !== ui_1.default.editor.codeMirrorInstance.getOption(optionName)) {
                if (optionName === "lint") {
                    if (optionValue === false)
                        allowLinting(false);
                    else if (optionValue === true && data.assetMode != null && data.lintedModes.indexOf(data.assetMode) !== -1)
                        allowLinting(true);
                }
                else
                    ui_1.default.editor.codeMirrorInstance.setOption(optionName, optionValue);
            }
        }
    }
}
// used in assetSubscriber.onAssetReceived() and onFTextSettingsResourceUpdated()
function allowLinting(allow) {
    if (allow === void 0) { allow = true; }
    // allowLinting shouldn't be called if the mode is unknow or not lintable or if linting is disable, but just to be sure
    if ((data.assetMode != null && data.lintedModes.indexOf(data.assetMode) === -1) ||
        (data.FTextSettingsResourcePub != null && data.FTextSettingsResourcePub.lint === false))
        allow = false;
    ui_1.default.editor.codeMirrorInstance.setOption("lint", allow);
    var gutters = ui_1.default.editor.codeMirrorInstance.getOption("gutters");
    if (allow === true && gutters.indexOf("CodeMirror-lint-markers") === -1) {
        gutters = ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"];
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", []);
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    else if (allow === false && gutters.indexOf("CodeMirror-lint-markers") !== -1) {
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]);
    }
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
        SupClient.setEntryRevisionDisabled(false);
        data.asset = asset;
        ui_1.default.setEditorContent(asset);
        // check for an extension at the end of the asset's path
        var assetPath = data.projectClient.entries.getPathFromId(asset.id);
        var extensionMatches = assetPath.match(/\.[a-zA-Z]+$/gi);
        var extension = null;
        if (extensionMatches != null)
            extension = extensionMatches[0].replace(".", "");
        // set Codemirror's mode
        if (extension != null) {
            var mode = data.modesByExtensions[extension] || extension;
            data.assetMode = mode;
            ui_1.default.editor.codeMirrorInstance.setOption("mode", mode);
            if (data.lintedModes.indexOf(mode) === -1)
                allowLinting(false);
        }
        data.projectClient.subResource("fTextSettings", resourceSubscriber);
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== SupClient.query.asset)
            return;
        if (ui_1.default.selectedRevision === "current" && onAssetCommands[command] != null)
            onAssetCommands[command].apply(data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        SupClient.onAssetTrashed();
    },
    onAssetRestored: function (id, asset) {
        if (id === SupClient.query.asset) {
            data.asset = asset;
            if (ui_1.default.selectedRevision === "current")
                ui_1.default.setEditorContent(data.asset);
        }
    }
};
// ----------------------------------------
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "fText")
                return;
            data.projectClient.subAsset(entry.id, "fText", assetSubscriber);
        });
    },
};
// called when the socket "welcome" event is emitted
function onWelcomed(clientId) {
    data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
    data.projectClient.subEntries(entriesSubscriber);
    ui_1.default.setupEditor(clientId);
}
