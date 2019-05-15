"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as querystring from "querystring";
const ui_1 = require("./ui");
const fTextSettingsResource_1 = require("../../data/fTextSettingsResource");
/* tslint:disable */
// expose the linter, used int he custom linters script
window.consparser = require("coffee-script"); // used to parse CSON. Neither https://github.com/groupon/cson-parser nor https://github.com/bevry/cson
window.CSSLint = require("csslint").CSSLint;
window.JSHINT = require("jshint").JSHINT;
window.jsonlint = require("jsonlint");
window.pug = require("pug");
window.stylus = require("stylus");
window.jsyaml = require("js-yaml");
const data = {
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
exports.default = data;
let socket;
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "fTextEditor" }], () => {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("welcome", onWelcomed);
    socket.on("disconnect", SupClient.onDisconnected);
});
// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()
// used in assetSubscriber.onAssetReceive() when subscribing to the resource
let resourceSubscriber = {
    onResourceReceived: (resourceId, resource) => {
        // I suppose the resource is always received after the asset since the resource is subscribed at the end of onAssetreceived()
        data.FTextSettingsResourcePub = resource.pub;
        onFTextSettingsResourceUpdated();
    },
    onResourceEdited: (resourceId, command, propertyName) => {
        onFTextSettingsResourceUpdated();
    }
};
// updates the editor (when open) when the resource is received or edited
// called from the resources handlers
function onFTextSettingsResourceUpdated() {
    if (ui_1.default.editor != null) {
        const pub = data.FTextSettingsResourcePub;
        const defaultValues = fTextSettingsResource_1.default.defaultValues;
        for (let optionName in defaultValues) {
            let optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
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
function allowLinting(allow = true) {
    // allowLinting shouldn't be called if the mode is unknow or not lintable or if linting is disable, but just to be sure
    if ((data.assetMode != null && data.lintedModes.indexOf(data.assetMode) === -1) ||
        (data.FTextSettingsResourcePub != null && data.FTextSettingsResourcePub.lint === false))
        allow = false;
    ui_1.default.editor.codeMirrorInstance.setOption("lint", allow);
    let gutters = ui_1.default.editor.codeMirrorInstance.getOption("gutters");
    if (allow === true && gutters.indexOf("CodeMirror-lint-markers") === -1) {
        gutters = ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"];
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", []);
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", gutters);
        // note when the lint gutter is added again after being removed,
        // the lint markers won't show up in the lint gutter until the asset tabs is reopened
    }
    else if (allow === false && gutters.indexOf("CodeMirror-lint-markers") !== -1) {
        ui_1.default.editor.codeMirrorInstance.setOption("gutters", ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]);
    }
    if (allow === false)
        ui_1.default.refreshErrors([]);
}
// ----------------------------------------
// used in assetSubscriber.onAssetEdited()
const onAssetCommands = {
    editText: (operationData) => {
        ui_1.default.hasDraft(true);
        ui_1.default.editor.receiveEditText(operationData);
    },
    applyDraftChanges: () => {
        ui_1.default.hasDraft(false);
    }
};
// ----------------------------------------
const assetSubscriber = {
    onAssetReceived: (id, asset) => {
        if (id !== SupClient.query.asset)
            return;
        SupClient.setEntryRevisionDisabled(false);
        data.asset = asset;
        ui_1.default.setEditorContent(asset);
        // check for an extension at the end of the asset's path
        const assetPath = data.projectClient.entries.getPathFromId(asset.id);
        const extensionMatches = assetPath.match(/\.[a-zA-Z]+$/gi);
        let extension = null;
        if (extensionMatches != null)
            extension = extensionMatches[0].replace(".", "");
        // set Codemirror's mode
        if (extension != null) {
            const mode = data.modesByExtensions[extension] || extension;
            data.assetMode = mode;
            ui_1.default.editor.codeMirrorInstance.setOption("mode", mode);
            if (data.lintedModes.indexOf(mode) === -1)
                allowLinting(false);
        }
        data.projectClient.subResource("fTextSettings", resourceSubscriber);
    },
    onAssetEdited: (id, command, ...args) => {
        if (id !== SupClient.query.asset)
            return;
        if (ui_1.default.selectedRevision === "current" && onAssetCommands[command] != null)
            onAssetCommands[command].apply(data.asset, args);
    },
    onAssetTrashed: (id) => {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        SupClient.onAssetTrashed();
    },
    onAssetRestored: (id, asset) => {
        if (id === SupClient.query.asset) {
            data.asset = asset;
            if (ui_1.default.selectedRevision === "current")
                ui_1.default.setEditorContent(data.asset);
        }
    }
};
// ----------------------------------------
const entriesSubscriber = {
    onEntriesReceived: (entries) => {
        entries.walk((entry) => {
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
