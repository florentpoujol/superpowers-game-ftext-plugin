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
