"use strict";
var network_1 = require("./network");
var ui = {
    selectedRevision: "current",
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
var errorPane = document.querySelector(".error-pane");
// the top bar of the error pane with the save button
// can have the has-draft class - sets from the onAssetCommands functions in network.ts
// can have the has-errors class - sets in ui.refreshErrors()
var errorPaneStatus = errorPane.querySelector(".status");
// the part of the errorPaneStatus with the text
var errorPaneInfo = errorPaneStatus.querySelector(".errorInfo");
var saveButton = errorPane.querySelector(".error-pane button");
// ----------------------------------------
// focus the editor
window.addEventListener("message", function (event) {
    if (event.data.type === "setRevision")
        onSelectRevision(event.data.revisionId);
    else if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    else if (event.data.type === "setState") {
        var line = parseInt(event.data.state.line, 10);
        var ch = parseInt(event.data.state.ch, 10);
        if (ui.editor != null)
            ui.editor.codeMirrorInstance.getDoc().setCursor({ line: line, ch: ch });
    }
});
function onSelectRevision(revisionId) {
    if (revisionId === "restored") {
        ui.selectedRevision = "current";
        ui.editor.codeMirrorInstance.setOption("readOnly", false);
        return;
    }
    ui.selectedRevision = revisionId;
    // clear editor
    ui.editor.setText("");
    ui.hasDraft(false);
    ui.refreshErrors([]);
    if (ui.selectedRevision === "current") {
        ui.setEditorContent(network_1.default.asset);
    }
    else {
        network_1.default.projectClient.getAssetRevision(SupClient.query.asset, "fText", ui.selectedRevision, function (id, asset) {
            ui.setEditorContent(asset);
        });
    }
}
// called from network.ts/assetSubscriber.onAssetReceived()
ui.setEditorContent = function (asset) {
    ui.editor.setText(asset.pub.draft);
    errorPaneStatus.classList.toggle("has-draft", asset.hasDraft && ui.selectedRevision === "current");
    if (ui.selectedRevision !== "current")
        ui.editor.codeMirrorInstance.setOption("readOnly", true);
};
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
    ui.editor = new TextEditorWidget(network_1.default.projectClient, clientId, textArea, {
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
            network_1.default.projectClient.editAsset(SupClient.query.asset, "editText", operation, network_1.default.asset.document.getRevisionId(), function (err) {
                if (err != null) {
                    new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close"));
                    SupClient.onDisconnected();
                }
            });
        }
    });
    // always set lint gutter here, because if it's removed and put back later, the lint markers do not show up anymore in the gutter
    var gutters = ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"];
    ui.editor.codeMirrorInstance.setOption("gutters", []);
    ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    // the lint gutter is removed in two cases :
    // - the lint option is false in the resource
    // - the asset's extension don't match any linted mode
    // resfreshErrors() is called from public/codemirror/custom-linters/lint.js to pass the number of errors
    ui.editor.codeMirrorInstance.refreshErrors = ui.refreshErrors;
};
// ----------------------------------------
// Error pane
// capture the click event on the error pane to set the cursor on the clicked error
errorPaneStatus.addEventListener("click", function (event) {
    if (errorPaneStatus.classList.contains("has-errors") === false)
        return;
    var line = errorPaneStatus.dataset.line;
    var character = errorPaneStatus.dataset.character;
    if (line != null) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
        ui.editor.codeMirrorInstance.focus();
    }
});
// called from network.ts/assetCommands/editText() and applyDraftChanges()
ui.hasDraft = function (hasDraft) {
    if (hasDraft === void 0) { hasDraft = true; }
    if (hasDraft === true) {
        errorPaneStatus.classList.add("has-draft");
        saveButton.textContent = SupClient.i18n.t("fTextEditor:save");
        saveButton.disabled = false;
    }
    else {
        errorPaneStatus.classList.remove("has-draft");
        saveButton.textContent = SupClient.i18n.t("fTextEditor:saved");
        saveButton.disabled = true;
    }
};
// a reference of this function is set to  ui.editor.codeMirrorInstance.refreshErrors
// so that it can be called from Codemirror's main lint script "public/codemirror/custom-linters/lint.js"
ui.refreshErrors = function (errors) {
    var text = "";
    if (errors == null || errors.length === 0) {
        var allowLint = ui.editor.codeMirrorInstance.getOption("lint");
        allowLint === true ? text = "- " + SupClient.i18n.t("fTextEditor:noError") : text = "";
        errorPaneInfo.textContent = text;
        errorPaneStatus.classList.remove("has-errors");
    }
    else {
        text = "- " + SupClient.i18n.t("fTextEditor:some-errors") + " - " + SupClient.i18n.t("fTextEditor:clickToError");
        errorPaneInfo.textContent = text;
        errorPaneStatus.classList.add("has-errors");
        errorPaneStatus.dataset.line = errors[0].from.line;
        errorPaneStatus.dataset.character = errors[0].from.ch;
    }
};
saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    applyDraftChanges();
});
// Save
// called when clicking Ctrl+S or the save button
function applyDraftChanges() {
    network_1.default.projectClient.editAssetNoErrorHandling(SupClient.query.asset, "applyDraftChanges", {}, function (err) {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(err);
            SupClient.onDisconnected();
        }
    });
    // no need to call ui.hasDraft(false) since its done in the assetCommands functions
}
