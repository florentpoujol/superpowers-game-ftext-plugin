import { data } from "./network";

const ui: {
  isAssetLinted: boolean; // set in network.ts/allowLinting()
  editor?: TextEditorWidget;
  errorPane?: HTMLDivElement;
  errorPaneStatus?: HTMLDivElement;
  errorPaneInfo?: HTMLDivElement;
  saveButton?: HTMLButtonElement;
  refreshErrors?: Function;
  hasDraft?: Function;
  setupEditor?: Function;
} = {
  isAssetLinted: true
};
export default ui;

// focus the editor
window.addEventListener("message", (event) => {
  if (event.data.type === "activate") ui.editor.codeMirrorInstance.focus();

  if (event.data.line != null && event.data.ch != null)
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line, 10), ch: parseInt(event.data.ch, 10) });
});

// Add a context menu on Right-Click when using NodeWebkit
const nwDispatcher = (window as any).nwDispatcher;
if (nwDispatcher != null) {
  const gui = nwDispatcher.requireNwGui();

  const menu = new gui.Menu();
  menu.append(new gui.MenuItem({ label: "Cut (Ctrl-X)", click: () => { document.execCommand("cut"); } }));
  menu.append(new gui.MenuItem({ label: "Copy (Ctrl-C)", click: () => { document.execCommand("copy"); } }));
  menu.append(new gui.MenuItem({ label: "Paste (Ctrl-V)", click: () => { document.execCommand("paste"); } }));

  document.querySelector(".text-editor-container").addEventListener("contextmenu", (event: any) => {
    event.preventDefault();
    menu.popup(event.screenX - gui.Window.get().x, event.screenY - gui.Window.get().y);
    return false;
  });
}

// called from network.ts/onWelcomed()
ui.setupEditor = function(clientId: string) {
  const textArea = document.querySelector(".text-editor") as HTMLTextAreaElement;
  ui.editor = new TextEditorWidget(data.projectClient, clientId, textArea, {
    mode: "",
    extraKeys: {
      "Ctrl-S": () => { applyDraftChanges(); },
      "Cmd-S": () => { applyDraftChanges(); },
      "Ctrl-Space": "autocomplete",
      "Cmd-Space": "autocomplete",
      "Cmd-J": "toMatchingTag",
      "Ctrl-J": "toMatchingTag"
    },
    editCallback: (text: string, origin: string) => { return; },
    sendOperationCallback: (operation: OperationData) => {
      data.projectClient.editAsset(SupClient.query.asset, "editText", operation, data.asset.document.getRevisionId(), (err: string) => {
        if (err != null) { new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close")); SupClient.onDisconnected(); }
      });
    }
  });

  // ui.editor.codeMirrorInstance.setOption("matchTags", true);

  // resfreshErrors() is called from codemirror-linters/lint.js to pass the number of errors
  (ui.editor.codeMirrorInstance as any).refreshErrors = ui.refreshErrors;
};

// ----------------------------------------
// Error pane

ui.errorPane = (document.querySelector(".error-pane") as HTMLDivElement);

// the top bar of the error pane with the save button
// can have the has-draft class - sets from the onAssetCommands functions in network.ts
// can have the has-errors class - sets in ui.refreshErrors()
ui.errorPaneStatus = (ui.errorPane.querySelector(".status") as HTMLDivElement);

// capture the click event on the whole error pane when it's open
// to set the cursor on the clicked error
ui.errorPaneStatus.addEventListener("click", (event: MouseEvent) => {
  if (ui.errorPaneStatus.classList.contains("has-errors") === false) return;

  let line: string = (ui.errorPaneStatus.dataset as any).line;
  let character: string = (ui.errorPaneStatus.dataset as any).character;
  if (line != null) {
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
    ui.editor.codeMirrorInstance.focus();
  }
});

// the part of the errorPaneStatus with the text
ui.errorPaneInfo = (ui.errorPaneStatus.querySelector(".errorInfo") as HTMLDivElement);

// a reference of this function is set to  ui.editor.codeMirrorInstance.refreshErrors
// so that it can be called from Codemirror's linters
ui.refreshErrors = function(errors?: Array<any>) {
  let text = "";
  if (errors == null || errors.length === 0) {
    ui.isAssetLinted === true ? text = "- " + SupClient.i18n.t("fTextEditor:noError") : text = "";
    ui.errorPaneInfo.textContent = text;
    ui.errorPaneStatus.classList.remove("has-errors");
  }
  else {
    text = " - " + errors.length;
    if (errors.length > 1)
      text += ` ${SupClient.i18n.t("fTextEditor:errors")} - ${SupClient.i18n.t("fTextEditor:clickToFirstError")}`;
    else
      text += ` ${SupClient.i18n.t("fTextEditor:error")} - ${SupClient.i18n.t("fTextEditor:clickToError")}`;

    ui.errorPaneInfo.textContent = text;
    ui.errorPaneStatus.classList.add("has-errors");
    (ui.errorPaneStatus.dataset as any).line = errors[0].from.line;
    (ui.errorPaneStatus.dataset as any).character = errors[0].from.ch;
  }
};

// called from network.ts/assetCommands/editText() and savetext()
ui.hasDraft = function(hasDraft: boolean = true) {
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
  data.projectClient.editAssetNoErrorHandling(SupClient.query.asset, "applyDraftChanges", {}, (err: string) => {
    if (err != null) { new SupClient.Dialogs.InfoDialog(err); SupClient.onDisconnected(); }
  });
  // no need to call ui.hasDraft(false) since its done in the assetCommands functions
}

ui.saveButton = (ui.errorPane.querySelector(".error-pane button") as HTMLButtonElement);
ui.saveButton.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  applyDraftChanges();
});
