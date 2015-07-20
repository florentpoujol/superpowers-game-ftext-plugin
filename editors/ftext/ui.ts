import info from "./info";
import { socket, data } from "./network";

let ui: {
  editor?: fTextEditorWidget;
  errorPane?: HTMLDivElement;
  errorPaneStatus?: HTMLDivElement;
  errorPaneInfo?: HTMLDivElement;
} = {};
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
export function setupEditor(clientId: number) {
  let textArea = <HTMLTextAreaElement>document.querySelector(".text-editor");
  ui.editor = new fTextEditorWidget(data.projectClient, clientId, textArea, {
    mode: "",
    extraKeys: {
      "Ctrl-Space": "autocomplete",
      "Cmd-Space": "autocomplete",
      "Cmd-J": "toMatchingTag",
      "Ctrl-J": "toMatchingTag"
    },
    editCallback: onEditText,
    sendOperationCallback: onSendOperation,
    saveCallback: onSaveText
  });
  
  ui.editor.codeMirrorInstance.setOption("matchTags", true);

  let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
  gutters.push("CodeMirror-foldgutter");
  ui.editor.codeMirrorInstance.setOption("gutters", gutters);
  ui.editor.codeMirrorInstance.setOption("foldGutter", true);

  // resfreshErrors() is called from codemirror-linters/lint.js to pass the number of errors
  (<any>ui.editor.codeMirrorInstance).refreshErrors = refreshErrors;
}

function onEditText(text: string, origin: string) {
  // We ignore the initial setValue
  if (origin !== "setValue") {
    // check for errors
  }
}

function onSendOperation(operation: OperationData) {
  socket.emit("edit:assets", info.assetId, "editText", operation, data.asset.document.getRevisionId(), (err: string) => {
    if (err != null) { alert(err); SupClient.onDisconnected(); }
  });
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

ui.errorPaneInfo = <HTMLDivElement>ui.errorPaneStatus.querySelector(".info");

function refreshErrors(errors?: Array<any>) { 
  if (errors == null || errors.length === 0) {
    ui.errorPaneInfo.textContent = "No error";
    ui.errorPaneStatus.classList.remove("has-errors");
  }
  else {
    ui.errorPaneInfo.textContent = `${errors.length} error${errors.length > 1 ? "s - Click to jump to the first error" : " - Click to jump to the error"}`;
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

// Save button
let saveButton = ui.errorPane.querySelector(".draft button");
saveButton.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  onSaveText();
});
