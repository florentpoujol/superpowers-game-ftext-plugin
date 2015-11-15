var info_1 = require("./info");
var network_1 = require("./network");
var ui = {
    isAssetLinted: true
};
Object.defineProperty(exports, "__esModule", { value: true });
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
