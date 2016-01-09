var info_1 = require("./info");
var ui_1 = require("./ui");
var fTextSettingsResource_1 = require("../../data/fTextSettingsResource");
exports.data = {};
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
SupClient.i18n.load([{ root: window.location.pathname + "/../..", name: "ftextEditor" }], function () {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("welcome", onWelcomed);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
