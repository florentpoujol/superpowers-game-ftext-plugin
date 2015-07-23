import info from "./info";
import { socket, data } from "./network";

let ui: {
  isAssetLinted: boolean; // set in network.ts/allowLinting()
  editor?: fTextEditorWidget;
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

SupClient.setupHotkeys();
window.addEventListener("message", (event) => {
  if (event.data.type === "activate") ui.editor.codeMirrorInstance.focus();

  if (event.data.line != null && event.data.ch != null)
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line), ch: parseInt(event.data.ch) });
});

// Add a context menu on Right-Click when using NodeWebkit
let nwDispatcher = (<any>window).nwDispatcher;
if (nwDispatcher != null) {
  let gui = nwDispatcher.requireNwGui();

  let menu = new gui.Menu();
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
ui.setupEditor = function(clientId: number) {
  let textArea = <HTMLTextAreaElement>document.querySelector(".text-editor");
  ui.editor = new fTextEditorWidget(data.projectClient, clientId, textArea, {
    mode: "",
    extraKeys: {
      "Ctrl-Space": "autocomplete",
      "Cmd-Space": "autocomplete",
      "Cmd-J": "toMatchingTag",
      "Ctrl-J": "toMatchingTag"
    },
    editCallback: (text: string, origin: string) => {},
    sendOperationCallback: onSendOperation,
    saveCallback: onSaveText
  });
  
  ui.editor.codeMirrorInstance.setOption("matchTags", true);

  ui.editor.codeMirrorInstance.getOption("gutters").push("CodeMirror-foldgutter");
  ui.editor.codeMirrorInstance.setOption("foldGutter", true);

  // resfreshErrors() is called from codemirror-linters/lint.js to pass the number of errors
  (<any>ui.editor.codeMirrorInstance).refreshErrors = ui.refreshErrors;
}

function onSendOperation(operation: OperationData) {
  socket.emit("edit:assets", info.assetId, "editText", operation, data.asset.document.getRevisionId(), (err: string) => { if (err != null) { alert(err); SupClient.onDisconnected(); }});
}

function onSaveText() {
  socket.emit("edit:assets", info.assetId, "saveText", (err: string) => { if (err != null) { alert(err); SupClient.onDisconnected(); }});
}

// ----------------------------------------
// Error pane

ui.errorPane = <HTMLDivElement>document.querySelector(".error-pane");
ui.errorPaneStatus = <HTMLDivElement>ui.errorPane.querySelector(".status");
ui.errorPaneStatus.addEventListener("click", onErrorPanelClick);
// has-draft added/removed from the onAssetCommands function in network.ts
ui.errorPaneInfo = <HTMLDivElement>ui.errorPaneStatus.querySelector(".errorInfo");

ui.refreshErrors = function(errors?: Array<any>) { 
  let text = "";
  if (errors == null || errors.length === 0) {
    ui.isAssetLinted === true ? text = "- No error": text = "";
    ui.errorPaneInfo.textContent = text;
    ui.errorPaneStatus.classList.remove("has-errors");
  }
  else {
    ui.errorPaneInfo.textContent = `- ${errors.length} error${errors.length > 1 ? "s - Click to jump to the first error" : " - Click to jump to the error"}`;
    ui.errorPaneStatus.classList.add("has-errors");
    (<any>ui.errorPaneStatus.dataset).line = errors[0].from.line;
    (<any>ui.errorPaneStatus.dataset).character = errors[0].from.ch;
  }
}

function onErrorPanelClick(event: MouseEvent) {
  if (ui.errorPaneStatus.classList.contains("has-errors") === false)
    return;

  let target = <HTMLElement>event.target;
  while (true) {
    if (target.tagName === "BUTTON") return;
    if (target === ui.errorPaneStatus) break;
    target = target.parentElement;
  }
  
  let line: string = (<any>target.dataset).line;
  let character: string = (<any>target.dataset).character;
  if (line != null) {
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line), ch: parseInt(character) });
    ui.editor.codeMirrorInstance.focus();
  }
}

// called from network.ts/assetCommands/editText() and savetext()
ui.hasDraft = function(hasDraft: boolean = true) {
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
}

// Save button
ui.saveButton = <HTMLButtonElement>ui.errorPane.querySelector(".draft button");
ui.saveButton.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  onSaveText();
});
