import FTextAsset from "../../data/fTextAsset";
import data from "./network";

const ui: {
  selectedRevision: string;
  editor?: TextEditorWidget; // set in ui.setupEditor()
  refreshErrors?: Function;
  hasDraft?: Function;
  setupEditor?: Function;
  setEditorContent?: Function;
} = {
  selectedRevision: "current",
};
export default ui;

const errorPane = (document.querySelector(".error-pane") as HTMLDivElement);

// the top bar of the error pane with the save button
// can have the has-draft class - sets from the onAssetCommands functions in network.ts
// can have the has-errors class - sets in ui.refreshErrors()
const errorPaneStatus = (errorPane.querySelector(".status") as HTMLDivElement);
// the part of the errorPaneStatus with the text
const errorPaneInfo = (errorPaneStatus.querySelector(".errorInfo") as HTMLDivElement);

const saveButton = (errorPane.querySelector(".error-pane button") as HTMLButtonElement);

// ----------------------------------------

// focus the editor
window.addEventListener("message", (event) => {
  if (event.data.type === "setRevision") onSelectRevision(event.data.revisionId);
  else if (event.data.type === "activate") ui.editor.codeMirrorInstance.focus();
  else if (event.data.type === "setState") {
    let line = parseInt(event.data.state.line, 10);
    let ch = parseInt(event.data.state.ch, 10);
    if (ui.editor != null) ui.editor.codeMirrorInstance.getDoc().setCursor({ line , ch });
  }
});

function onSelectRevision(revisionId: string) {
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
    ui.setEditorContent(data.asset);
  } else {
    data.projectClient.getAssetRevision(SupClient.query.asset, "fText", ui.selectedRevision, (id: string, asset: FTextAsset) => {
      ui.setEditorContent(asset);
    });
  }
}

// called from network.ts/assetSubscriber.onAssetReceived()
ui.setEditorContent = function(asset: FTextAsset) {
  ui.editor.setText(asset.pub.draft);
  errorPaneStatus.classList.toggle("has-draft", asset.hasDraft && ui.selectedRevision === "current");

  if (ui.selectedRevision !== "current") ui.editor.codeMirrorInstance.setOption("readOnly", true);
};

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

  // always set lint gutter here, because if it's removed and put back later, the lint markers do not show up anymore in the gutter
  const gutters = ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"];
  ui.editor.codeMirrorInstance.setOption("gutters", []);
  ui.editor.codeMirrorInstance.setOption("gutters", gutters);
  // the lint gutter is removed in two cases :
  // - the lint option is false in the resource
  // - the asset's extension don't match any linted mode

  // resfreshErrors() is called from public/codemirror/custom-linters/lint.js to pass the number of errors
  (ui.editor.codeMirrorInstance as any).refreshErrors = ui.refreshErrors;
};

// ----------------------------------------
// Error pane

// capture the click event on the error pane to set the cursor on the clicked error
errorPaneStatus.addEventListener("click", (event: MouseEvent) => {
  if (errorPaneStatus.classList.contains("has-errors") === false) return;

  const line: string = (errorPaneStatus.dataset as any).line;
  const character: string = (errorPaneStatus.dataset as any).character;
  if (line != null) {
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
    ui.editor.codeMirrorInstance.focus();
  }
});

// called from network.ts/assetCommands/editText() and applyDraftChanges()
ui.hasDraft = function(hasDraft: boolean = true) {
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
ui.refreshErrors = function(errors?: Array<any>) {
  let text = "";
  if (errors == null || errors.length === 0) {
    const allowLint = ui.editor.codeMirrorInstance.getOption("lint");
    allowLint === true ? text = "- " + SupClient.i18n.t("fTextEditor:noError") : text = "";
    errorPaneInfo.textContent = text;
    errorPaneStatus.classList.remove("has-errors");
  }
  else {
    text = `- ${SupClient.i18n.t("fTextEditor:some-errors")} - ${SupClient.i18n.t("fTextEditor:clickToError")}`;

    errorPaneInfo.textContent = text;
    errorPaneStatus.classList.add("has-errors");
    (errorPaneStatus.dataset as any).line = errors[0].from.line;
    (errorPaneStatus.dataset as any).character = errors[0].from.ch;
  }
};

saveButton.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  applyDraftChanges();
});

// Save
// called when clicking Ctrl+S or the save button
function applyDraftChanges() {
  data.projectClient.editAssetNoErrorHandling(SupClient.query.asset, "applyDraftChanges", {}, (err: string) => {
    if (err != null) { new SupClient.Dialogs.InfoDialog(err); SupClient.onDisconnected(); }
  });
  // no need to call ui.hasDraft(false) since its done in the assetCommands functions
}
