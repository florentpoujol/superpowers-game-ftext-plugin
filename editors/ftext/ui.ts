import info from "./info";
import { socket, data } from "./network";
import { compile } from "./compilator";

let PerfectResize = require("perfect-resize");

let ui: {
  editor?: fTextEditorWidget;
  
  compilableSyntaxes: string[];
  lintableSyntaxes: string[];

  errorPane?: HTMLDivElement;
  errorPaneStatus?: HTMLDivElement;
  errorPaneInfo?: HTMLDivElement;
  errorsTBody?: HTMLTableSectionElement;

  infoElement?: HTMLDivElement;
  infoPosition?: CodeMirror.Position;
  infoTimeout?: number;
} = {
  compilableSyntaxes: ["cson", "jade", "stylus"],
  lintableSyntaxes: ["js", "css", "json"]
};
export default ui;

SupClient.setupHotkeys();
window.addEventListener("message", (event) => {
  if (event.data.type === "activate") ui.editor.codeMirrorInstance.focus();

  if (event.data.line != null && event.data.ch != null)
    ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line), ch: parseInt(event.data.ch) });
});

// Context menu
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
  
  ui.editor.codeMirrorInstance.setOption("foldGutter", true);
  ui.editor.codeMirrorInstance.setOption("matchTags", true);
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

// ----------------------------------------

// used in network.ts/assetHandlers/onAssetReceived()
export function allowCompilation(allow: boolean = true) {
  if (allow === true) {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("line-error-gutter");
    if (index === -1) {
      gutters.unshift("line-error-gutter");
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.errorPane.style.display = "block";
    compile(data);
  }
  else {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("line-error-gutter");
    if (index !== -1) {
      gutters.splice(index, 1);
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.errorPane.style.display = "none";
  }
}

// used in network.ts/assetHandlers/onAssetReceived()
export function allowLinting(allow: boolean = true) {
  if (allow === true) {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("CodeMirror-lint-markers");
    if (index === -1) {
      gutters.unshift("CodeMirror-lint-markers");
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.editor.codeMirrorInstance.setOption("lint", true);
  }
  else {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("CodeMirror-lint-markers");
    if (index !== -1) {
      gutters.splice(index, 1);
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.editor.codeMirrorInstance.setOption("lint", false);
  }
}

// ----------------------------------------
// Error pane

ui.errorPane = <HTMLDivElement>document.querySelector(".error-pane");
ui.errorPane.style.display = "none";
ui.errorPaneStatus = <HTMLDivElement>ui.errorPane.querySelector(".status");
ui.errorPaneInfo = <HTMLDivElement>ui.errorPaneStatus.querySelector(".info");

ui.errorsTBody = <HTMLTableSectionElement>ui.errorPane.querySelector(".errors tbody");
ui.errorsTBody.addEventListener("click", onErrorTBodyClick);

let errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
errorPaneResizeHandle.on("drag", () => { ui.editor.codeMirrorInstance.refresh(); });

let errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");
ui.errorPaneStatus.addEventListener("click", (event: any) => {
  if (event.target.tagName === "BUTTON" && event.target.parentElement.className === "draft") return;
  toggleErrorPanel();
});

function toggleErrorPanel(display?: boolean) {
  let collapsed = false;
  if (display !== undefined)
    collapsed = !display;
  else
    collapsed = !ui.errorPane.classList.contains("collapsed");

  errorPaneToggleButton.textContent = collapsed ? "+" : "–";
  // ui.errorPane.classList.toggle("collapsed", collapsed);
  if (collapsed)
    ui.errorPane.classList.add("collapsed");
  else
    ui.errorPane.classList.remove("collapsed");
  errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
  ui.editor.codeMirrorInstance.refresh();
}

// export function refreshErrors(errors: Array<{position: {line: number; character: number;}; message: string}>) {
export function refreshErrors(errors?: Array<any>) {
  // Remove all previous errors
  for (let textMarker of ui.editor.codeMirrorInstance.getDoc().getAllMarks()) {
    if ((<any>textMarker).className !== "line-error") continue;
    textMarker.clear();
  }

  ui.editor.codeMirrorInstance.clearGutter("line-error-gutter");
  ui.errorsTBody.innerHTML = "";
  
  if (errors == null) errors = new Array<any>();
  if (errors.length === 0) {
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
    toggleErrorPanel(false);
    return;
  }
  else {
    ui.errorPaneInfo.textContent = `${errors.length} error${errors.length > 1 ? "s" : ""}`;
    toggleErrorPanel(true);
  }

  ui.errorPaneStatus.classList.add("has-errors");

  let lastSelfErrorRow: HTMLTableRowElement = null;

  // Display new ones
  for (let error of errors) {
    // console.log("error objecr", error);

    if (error.position == null)
      error.position = { line: -1, character: -1 };
    if (error.position.line == null)
      error.position.line = -1;
    if (error.position.character == null)
      error.position.character = -1;
    
    if (error.length == null)
      error.length = 1;

    error.position.line--;
    error.position.character--;

    let errorRow = document.createElement("tr");
    (<any>errorRow.dataset).line = error.position.line;
    (<any>errorRow.dataset).character = error.position.character;

    let positionCell = document.createElement("td");
    if (error.position.line !== -2) 
      positionCell.textContent = (error.position.line + 1).toString();
    errorRow.appendChild(positionCell);

    let messageCell = document.createElement("td");
    messageCell.classList.add("errorMessageCell")
    messageCell.innerHTML = error.message;
    errorRow.appendChild(messageCell);

    ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
    lastSelfErrorRow = errorRow;

    let line = error.position.line;
    if (line !== -2) {
      ui.editor.codeMirrorInstance.getDoc().markText(
        { line , ch: error.position.character },
        { line, ch: error.position.character + error.length },
        { className: "line-error" }
      );

      let gutter = document.createElement("div");
      gutter.className = "line-error-gutter";
      gutter.innerHTML = "●";
      ui.editor.codeMirrorInstance.setGutterMarker(line, "line-error-gutter", gutter);
    }
  }
}

function onErrorTBodyClick(event: MouseEvent) {
  let target = <HTMLElement>event.target;
  while (true) {
    if (target.tagName === "TBODY") return;
    if (target.tagName === "TR") break;
    target = target.parentElement;
  }
  
  let line: string = (<any>target.dataset).line;
  let character: string = (<any>target.dataset).character;

  ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line), ch: parseInt(character) });
  ui.editor.codeMirrorInstance.focus();
}

// Save button
let saveButton = ui.errorPane.querySelector(".draft button");
saveButton.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  onSaveText();
});

function onSaveText() {
  socket.emit("edit:assets", info.assetId, "saveText", (err: string) => { if (err != null) { alert(err); SupClient.onDisconnected(); }});
}
