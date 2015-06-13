import * as async from "async";
import * as OT from "operational-transform";

import fTextAsset from "../../data/fTextAsset";
import fTextSettingsResource from "../../data/fTextSettingsResource";

(<any>window).CodeMirror = require("codemirror");

// typescript plugin addons:
require("codemirror/addon/search/search");
require("codemirror/addon/search/searchcursor");
require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/comment/comment");
require("codemirror/addon/hint/show-hint");
require("codemirror/addon/selection/active-line");
require("codemirror/keymap/sublime");
require("codemirror/mode/javascript/javascript");

// ftext plugin addons:
require("codemirror/addon/fold/foldcode");
require("codemirror/addon/fold/foldgutter");
require("codemirror/addon/fold/brace-fold");
require("codemirror/addon/fold/comment-fold");
require("codemirror/addon/fold/indent-fold");
require("codemirror/addon/fold/xml-fold");
require("codemirror/addon/fold/markdown-fold");
require("codemirror/addon/search/match-highlighter");
require("codemirror/addon/edit/matchtags"); // depends on xml-fold
require("codemirror/addon/edit/trailingspace");
require("codemirror/addon/edit/closetag"); // depends on xml-fold

require("codemirror/addon/selection/active-line");
require("codemirror/addon/hint/anyword-hint");
require("codemirror/keymap/emacs");
require("codemirror/keymap/vim");

require("codemirror/mode/htmlmixed/htmlmixed"); // load js, css, xml
require("codemirror/mode/jade/jade");
require("codemirror/mode/markdown/markdown"); // load xml
require("codemirror/mode/coffeescript/coffeescript");
require("codemirror/mode/clike/clike");
require("codemirror/mode/stylus/stylus");

let PerfectResize = require("perfect-resize");

let qs = require("querystring").parse(window.location.search.slice(1));
let info = { projectId: qs.project, assetId: qs.asset, line: qs.line, ch: qs.ch };

let data: { 
  clientId: number;
  projectClient?: SupClient.ProjectClient;
  assetsById?: {[id: string]: fTextAsset};
  asset?: fTextAsset;
  assetInstructions?: { [key: string]: any },
  fTextSettingsResourcePub?: any,
};

let ui: {
  editor?: CodeMirror.EditorFromTextArea;
  tmpCodeMirrorDoc?: CodeMirror.Doc;
  errorPane?: HTMLDivElement;
  errorPaneStatus?: HTMLDivElement;
  errorPaneInfo?: HTMLDivElement;
  errorsTBody?: HTMLTableSectionElement;

  undoTimeout?: number;
  errorCheckTimeout?: number;
  completionTimeout?: number;
  texts?: string[];

  undoStack?: OT.TextOperation[];
  undoQuantityByAction?: number[];
  redoStack?: OT.TextOperation[];
  redoQuantityByAction?: number[];

  infoElement?: HTMLDivElement;
  infoPosition?: CodeMirror.Position;
  infoTimeout?: number;

  sentOperation?: OT.TextOperation;
  pendingOperation?: OT.TextOperation;
} = {};
let socket: SocketIOClient.Socket;


function start() {
  socket = SupClient.connect(info.projectId);
  socket.on("welcome", onWelcome);
  socket.on("disconnect", SupClient.onDisconnected);
  SupClient.setupHotkeys();

  window.addEventListener("message", (event) => {
    if (event.data.type === "activate") ui.editor.focus();

    if (event.data.line != null && event.data.ch != null)
      ui.editor.getDoc().setCursor({ line: parseInt(event.data.line), ch: parseInt(event.data.ch) });
  });

  let extraKeys = {
    "F9": () => {},
    "Tab": (cm: any) => {
      if (cm.getSelection() !== "") cm.execCommand("indentMore");
      else cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "));
    },
    "Cmd-X": () => { document.execCommand("cut"); },
    "Cmd-C": () => { document.execCommand("copy"); },
    "Cmd-V": () => { document.execCommand("paste"); },
    "Ctrl-Z": () => { onUndo(); },
    "Cmd-Z": () => { onUndo(); },
    "Shift-Ctrl-Z": () => { onRedo(); },
    "Shift-Cmd-Z": () => { onRedo(); },
    "Ctrl-Y": () => { onRedo(); },
    "Cmd-Y": () => { onRedo(); },
    "Ctrl-S": () => {
      socket.emit("edit:assets", info.assetId, "saveText", (err: string) => { if (err != null) { alert(err); SupClient.onDisconnected(); }});
    },
    "Cmd-S": () => {
      socket.emit("edit:assets", info.assetId, "saveText", (err: string) => { if (err != null) { alert(err); SupClient.onDisconnected(); }});
    },
    "Ctrl-Space": "autocomplete",
    "Cmd-Space": "autocomplete",
    "Cmd-J": "toMatchingTag",
    "Ctrl-J": "toMatchingTag"
  }

  let textArea = <HTMLTextAreaElement>document.querySelector(".code-editor");
  
  ui.editor = CodeMirror.fromTextArea(textArea, {
    indentUnit: 2, // how many spaces = 1 tab (tabSize seems to have no effect ?)
    keyMap: "sublime", 
    matchBrackets: true,
    styleActiveLine: true,
    autoCloseBrackets: true,
    matchTags: true,
    foldGutter: true,

    lineNumbers: true,
    gutters: ["line-error-gutter", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: extraKeys,
    viewportMargin: Infinity,
    readOnly: true
  });

  ui.tmpCodeMirrorDoc = new CodeMirror.Doc("");
  ui.texts = [];

  ui.undoStack = [];
  ui.undoQuantityByAction = [0];
  ui.redoStack = [];
  ui.redoQuantityByAction = [];

  ui.editor.on("beforeChange", (instance: CodeMirror.Editor, change: any) => {
    if (change.origin === "setValue" || change.origin === "network") return;
    let lastText = instance.getDoc().getValue();
    if (lastText !== ui.texts[ui.texts.length - 1]) ui.texts.push(lastText);
  });

  (<any>ui.editor).on("changes", onEditText);

  // (<any>CodeMirror).commands.autocomplete = (cm: CodeMirror.Editor) => { scheduleCompletion(); };

  ui.infoElement = document.createElement("div");
  ui.infoElement.classList.add("popup-info");

  let nwDispatcher = (<any>window).nwDispatcher;
  if (nwDispatcher != null) {
    let gui = nwDispatcher.requireNwGui();

    let menu = new gui.Menu();
    menu.append(new gui.MenuItem({ label: "Cut (Ctrl-X)", click: () => { document.execCommand("cut"); } }));
    menu.append(new gui.MenuItem({ label: "Copy (Ctrl-C)", click: () => { document.execCommand("copy"); } }));
    menu.append(new gui.MenuItem({ label: "Paste (Ctrl-V)", click: () => { document.execCommand("paste"); } }));

    document.body.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      menu.popup(event.screenX - gui.Window.get().x, event.screenY - gui.Window.get().y);
      return false;
    });
  }

  // Error pane
  ui.errorPane = <HTMLDivElement>document.querySelector(".error-pane");
  ui.errorPane.style.display = "none"; // temp, completely hide error panel

  /*ui.errorPaneStatus = <HTMLDivElement>ui.errorPane.querySelector(".status");
  ui.errorPaneInfo = <HTMLDivElement>ui.errorPaneStatus.querySelector(".info");

  ui.errorsTBody = <HTMLTableSectionElement>ui.errorPane.querySelector(".errors tbody");
  ui.errorsTBody.addEventListener("click", onErrorTBodyClick);

  let errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
  errorPaneResizeHandle.on("drag", () => { ui.editor.refresh(); });

  let errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");

  ui.errorPaneStatus.addEventListener("click", () => {
    let collapsed = ui.errorPane.classList.toggle("collapsed");
    console.log("collapse client", collapsed);
    errorPaneToggleButton.textContent = collapsed ? "+" : "–";
    errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
    ui.editor.refresh();
  });*/

  ui.editor.focus();
}


// read the asset's content then return a list of instructions and their values
// used to populate data.localEditorSettings
// called from onAssetReceived()
function parseInstructions() {
  let text = ui.editor.getDoc().getValue();
  let instructions: any = {};
  let regex = /@ftextasset\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?/ig
  let match: any;
  let i = ui.editor.getDoc().lineCount(); // make sure the loop does not run more than the number of lines
  
  do {
    match = regex.exec(text);
    if (match != null && match[1] != undefined) {
      let name = match[1].trim().toLowerCase();
      let value = match[3];
      if (value !== undefined) value = value.trim();
      else value = "";
      instructions[name] = value;
    }
    i--;
  }
  while (match != null && i > 0);

  return instructions;
}

function loadThemeStyle(theme: string) {
  let link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `codemirror-themes/${theme}.css`;
  document.head.appendChild(link);
}

// --------------------------------------------------------------------------------
// Network callbacks

let onAssetCommands: any = {
  editText: (operationData: OT.OperationData) => {
    if (data.clientId === operationData.userId) {
      if (ui.pendingOperation != null) {
        socket.emit("edit:assets", info.assetId, "editText", ui.pendingOperation.serialize(), data.asset.document.operations.length, (err: string) => {
          if (err != null) { alert(err); SupClient.onDisconnected(); }
        });

        ui.sentOperation = ui.pendingOperation;
        ui.pendingOperation = null;
      } else ui.sentOperation = null;
      return;
    }

    // Transform operation and local changes
    let operation = new OT.TextOperation();
    operation.deserialize(operationData);

    if (ui.sentOperation != null) {
      [ui.sentOperation, operation] = ui.sentOperation.transform(operation);

      if (ui.pendingOperation != null) [ui.pendingOperation, operation] = ui.pendingOperation.transform(operation);
    }
    ui.undoStack = transformStack(ui.undoStack, operation);
    ui.redoStack = transformStack(ui.redoStack, operation);

    applyOperation(operation.clone(), "network", false);
  }
};

// ----------------------------------------

let assetHandlers: any = {
  onAssetReceived: (err: string, asset: fTextAsset) => {
    data.assetsById[asset.id] = asset;

    if (asset.id === info.assetId) {
      data.asset = asset;

      ui.editor.getDoc().setValue(data.asset.pub.draft);
      ui.editor.getDoc().clearHistory();
      ui.editor.setOption("readOnly", false);
      if (info.line != null) ui.editor.getDoc().setCursor({ line: parseInt(info.line), ch: parseInt(info.ch) });

      // fText specific settings
      data.assetInstructions = parseInstructions();

      let mode: string = data.assetInstructions["syntax"];
      
      if (mode == null) { // check the extension of the asset name
        let path = data.projectClient.entries.getPathFromId(asset.id);
        let match = /\.([a-z]+)$/ig.exec(path);
        if (match != null && match[1] != null)
          mode = match[1];
      }

      if (mode != null) {
        let shortcuts: { [key: string]: string } = {
          coffee: "coffeescript",
          cson: "coffeescript",
          html: "htmlmixed",
          js: "javascript",
          json: "application/json",
          less: "text/x-less",
          md: "markdown",
          shader: "x-shader/x-fragment",
          styl: "stylus",
        };
        mode = shortcuts[mode] || mode;
        ui.editor.setOption("mode", mode);
        console.log("Loaded Mode:", mode);
      }
    }
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    if (id !== info.assetId) {
      /*if (command === "saveText") {
      }*/
      return
    }

    if (onAssetCommands[command] != null) onAssetCommands[command].apply(data.asset, args);
  },

  onAssetTrashed: (id: string) => {
    if (id !== info.assetId) return;

    if (ui.undoTimeout != null) clearTimeout(ui.undoTimeout);
    // if (ui.errorCheckTimeout != null) clearTimeout(ui.errorCheckTimeout);
    // if (ui.completionTimeout != null) clearTimeout(ui.completionTimeout);
    SupClient.onAssetTrashed();
  },
};

// ----------------------------------------

let entriesHandlers: any = {
  onEntriesReceived: (entries: SupCore.data.Entries) => {
    entries.walk((entry: any) => {
      if (entry.type !== "fText") return;
      data.projectClient.subAsset(entry.id, "fText", assetHandlers);
    })
  },

  onEntryAdded: (newEntry: any, parentId: string, index: number) => {
    if (newEntry.type !== "fText") return;
    data.projectClient.subAsset(newEntry.id, "fText", assetHandlers);
  },

  onEntryMoved: (id: string, parentId: string, index: number) => {
  },

  onSetEntryProperty: (id: string, key: string, value: any) => {
  },

  onEntryTrashed: (id: string) => {
  },
}

// ----------------------------------------

// updates the editor whe the resource is received or edited
// called from the resources handlers
let onfTextSettingsUpdated: any = (resourcePub: any) => {
  let pub = data.fTextSettingsResourcePub;

  if (ui.editor != null) {
    let settings = fTextSettingsResource.defaultValues;

    for (let name in settings) {
      let value = (pub[name] != null) ? pub[name] : settings[name];
      // can't do 'pub[name] || settings[name]' because if pub[name] == false, the defautl value is always chosen.

      if (value != ui.editor.getOption(name)) {
        ui.editor.setOption(name, value);
        if (name === "theme")
          loadThemeStyle(value);
      }
    }
  }
};

let resourceHandlers: any = {
  onResourceReceived: (resourceId: string, resource: fTextSettingsResource) => {
    data.fTextSettingsResourcePub = resource.pub;
    onfTextSettingsUpdated();
  },

  onResourceEdited: (resourceId: string, command: string, propertyName: string) => {
    onfTextSettingsUpdated();
  }
}

function onWelcome(clientId: number) {
  data = { clientId, assetsById: {} }
  data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
  data.projectClient.subEntries(entriesHandlers);

  data.projectClient.subResource("fTextSettings", resourceHandlers);
}

// --------------------------------------------------------------------------------

function transformStack(stack: OT.TextOperation[], operation: OT.TextOperation) {
  if (stack.length === 0) return stack;

  let newStack: OT.TextOperation[] = [];
  for (let i = stack.length - 1; i > 0; i--) {
    let pair = stack[i].transform(operation);
    newStack.push(pair[0]);
    operation = pair[1];
  }
  return newStack.reverse();
}

function applyOperation(operation: OT.TextOperation, origin: string, moveCursor: boolean) {
  let cursorPosition = 0;
  let line = 0;
  for (let op of operation.ops) {
    switch (op.type) {
      case "retain": {
        while (true) {
          if (op.attributes.amount <= ui.editor.getDoc().getLine(line).length - cursorPosition) break;

          op.attributes.amount -= ui.editor.getDoc().getLine(line).length + 1 - cursorPosition;
          cursorPosition = 0;
          line++;
        }

        cursorPosition += op.attributes.amount;
        break;
      }
      case "insert": {
        let cursor = ui.editor.getDoc().getCursor();

        let texts = op.attributes.text.split("\n");
        for (let textIndex = 0; textIndex < texts.length; textIndex++) {
          let text = texts[textIndex];
          if (textIndex !== texts.length - 1) text += "\n";
          (<any>ui.editor).replaceRange(text, { line, ch: cursorPosition }, null, origin);
          cursorPosition += text.length;

          if (textIndex !== texts.length - 1) {
            cursorPosition = 0;
            line++;
          }
        }

        if (line === cursor.line && cursorPosition === cursor.ch) {
          if (! operation.gotPriority(data.clientId)) {
            for (let i = 0; i < op.attributes.text.length; i++) (<any>ui.editor).execCommand("goCharLeft");
          }
        }

        if (moveCursor) (<any>ui.editor).setCursor(line, cursorPosition);
        break;
      }
      case "delete": {
        let texts = op.attributes.text.split("\n");

        for (let textIndex = 0; textIndex < texts.length; textIndex++) {
          let text = texts[textIndex];
          if (texts[textIndex + 1] != null) (<any>ui.editor).replaceRange("", { line, ch: cursorPosition }, { line: line + 1, ch: 0 }, origin);
          else (<any>ui.editor).replaceRange("", { line, ch: cursorPosition }, { line, ch: cursorPosition + text.length }, origin);

          if (moveCursor) (<any>ui.editor).setCursor(line, cursorPosition);
        }
        break;
      }
    }
  }
}

/*function clearInfoPopup() {
  if (ui.infoElement.parentElement != null) ui.infoElement.parentElement.removeChild(ui.infoElement);
  if (ui.infoTimeout != null) clearTimeout(ui.infoTimeout);
}

let isCheckingForErrors: boolean = false;
let hasScheduledErrorCheck: boolean = false;

interface CompletionRequest {
  callback: any;
  cursor: any;
  token: any;
  start: any;
}

let activeCompletion: CompletionRequest;
let nextCompletion: CompletionRequest;

typescriptWorker.onmessage = (event: MessageEvent) => {
  switch(event.data.type) {
    case "errors":
      refreshErrors(event.data.errors);
      isCheckingForErrors = false;
      if (hasScheduledErrorCheck) startErrorCheck();
      break;

    case "completion":
      if (nextCompletion != null) {
        activeCompletion = null;
        startAutocomplete();
        return;
      }

      for (let item of event.data.list) {
        item.render = (parentElt: HTMLDivElement, data: any, item: { kind: string; name: string; info: string }) => {
          parentElt.style.maxWidth = "100em";

          let rowElement = document.createElement("div");
          rowElement.style.display = "flex";
          parentElt.appendChild(rowElement);

          let kindElement = document.createElement("div");
          kindElement.style.marginRight = "0.5em";
          kindElement.style.width = "6em";
          kindElement.textContent = item.kind;
          rowElement.appendChild(kindElement);

          let nameElement = document.createElement("div");
          nameElement.style.marginRight = "0.5em";
          nameElement.style.width = "15em";
          nameElement.style.fontWeight = "bold";
          nameElement.textContent = item.name;
          rowElement.appendChild(nameElement);

          let infoElement = document.createElement("div");
          infoElement.textContent = item.info;
          rowElement.appendChild(infoElement);
        };
      }
      let from = (<any>CodeMirror).Pos(activeCompletion.cursor.line, activeCompletion.token.start);
      let to = (<any>CodeMirror).Pos(activeCompletion.cursor.line, activeCompletion.token.end);
      activeCompletion.callback({ list: event.data.list, from, to });
      activeCompletion = null;
      break;

    case "quickInfo":
      if (ui.infoTimeout == null) {
        ui.infoElement.textContent = event.data.text;
        ui.editor.addWidget(ui.infoPosition, ui.infoElement, false)
      }
      //if (token.string !== "" && token.string !== " ") {

      //}
      break;
  }
};

function startErrorCheck() {
  if (isCheckingForErrors) return;

  isCheckingForErrors = true;
  hasScheduledErrorCheck = false;
  typescriptWorker.postMessage({ type: "checkForErrors" });
}

function scheduleErrorCheck() {
  if (ui.errorCheckTimeout != null) clearTimeout(ui.errorCheckTimeout);

  ui.errorCheckTimeout = window.setTimeout(() => {
    hasScheduledErrorCheck = true;
    if (!isCheckingForErrors) startErrorCheck();
  }, 300);
}

function startAutocomplete() {
  if (activeCompletion != null) return;

  activeCompletion = nextCompletion;
  nextCompletion = null;

  typescriptWorker.postMessage({
    type: "getCompletionAt",
    tokenString: activeCompletion.token.string,
    name: fileNamesByScriptId[info.assetId],
    start: activeCompletion.start
  });
}
*/
// User interface
function refreshErrors(errors: Array<{file: string; position: {line: number; character: number;}; length: number; message: string}>) {
  // Remove all previous erros
  for (let textMarker of ui.editor.getDoc().getAllMarks()) {
    if ((<any>textMarker).className !== "line-error") continue;
    textMarker.clear();
  }

  ui.editor.clearGutter("line-error-gutter");

  ui.errorsTBody.innerHTML = "";

  if (errors.length === 0) {
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
    return;
  }

  ui.errorPaneStatus.classList.add("has-errors");

  let selfErrorsCount = 0;
  let lastSelfErrorRow: HTMLTableRowElement = null;

  // Display new ones
  for (let error of errors) {
    let errorRow = document.createElement("tr");
    //(<any>errorRow.dataset).assetId = files[error.file].id;
    (<any>errorRow.dataset).line = error.position.line;
    (<any>errorRow.dataset).character = error.position.character;

    let positionCell = document.createElement("td");
    positionCell.textContent = (error.position.line + 1).toString();
    errorRow.appendChild(positionCell);

    let messageCell = document.createElement("td");
    messageCell.textContent = error.message;
    errorRow.appendChild(messageCell);

    let scriptCell = document.createElement("td");
    scriptCell.textContent = error.file.substring(0, error.file.length - 3);
    errorRow.appendChild(scriptCell);

    /*if (error.file !== fileNamesByScriptId[info.assetId]) {
      ui.errorsTBody.appendChild(errorRow);
      continue;
    }*/

    ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
    lastSelfErrorRow = errorRow;
    selfErrorsCount++;

    let line = error.position.line;
    ui.editor.getDoc().markText(
      { line , ch: error.position.character },
      { line, ch: error.position.character + error.length },
      { className: "line-error" }
    );

    let gutter = document.createElement("div");
    gutter.className = "line-error-gutter";
    gutter.innerHTML = "●";
    ui.editor.setGutterMarker(line, "line-error-gutter", gutter);
  }

  let otherErrorsCount = errors.length - selfErrorsCount;
  if (selfErrorsCount > 0) {
    if (otherErrorsCount == 0) ui.errorPaneInfo.textContent = `${selfErrorsCount} error${selfErrorsCount > 1 ? "s" : ""}`;
    else ui.errorPaneInfo.textContent = `${selfErrorsCount} error${selfErrorsCount > 1 ? "s" : ""} in this script, ${otherErrorsCount} in other scripts`;
  } else {
    ui.errorPaneInfo.textContent = `${errors.length} error${errors.length > 1 ? "s" : ""} in other scripts`;
  }
}

function onErrorTBodyClick(event: MouseEvent) {
  let target = <HTMLElement>event.target;
  while (true) {
    if (target.tagName === "TBODY") return;
    if (target.tagName === "TR") break;
    target = target.parentElement;
  }

  let assetId: string = (<any>target.dataset).assetId;
  let line: string = (<any>target.dataset).line;
  let character: string = (<any>target.dataset).character;

  if (assetId === info.assetId) {
    ui.editor.getDoc().setCursor({ line: parseInt(line), ch: parseInt(character) });
    ui.editor.focus();
  } else {
    let origin: string = (<any>window.location).origin;
    if (window.parent != null) window.parent.postMessage({ type: "openEntry", id: assetId, options: { line, ch: character } }, origin);
  }
}

let localVersionNumber = 0;
function onEditText(instance: CodeMirror.Editor, changes: CodeMirror.EditorChange[]) {
  // let localFileName = fileNamesByScriptId[info.assetId];
  // let localFile = files[localFileName];
  // localFile.text = ui.editor.getDoc().getValue();
  localVersionNumber++;
  // localFile.version = `l${localVersionNumber}`;

  // We ignore the initial setValue
  /*if ((<any>changes[0]).origin !== "setValue") {
    typescriptWorker.postMessage({ type: "updateFile", fileName: localFileName, text: localFile.text, version: localFile.version });
    scheduleErrorCheck();
  }*/

  let undoRedo = false;
  let operationToSend: OT.TextOperation;
  for (let changeIndex = 0; changeIndex < changes.length; changeIndex++) {
    let change = changes[changeIndex];
    let origin: string = (<any>change).origin;

    // Modification from an other person
    if (origin === "setValue" || origin ==="network") continue;

    ui.tmpCodeMirrorDoc.setValue(ui.texts[changeIndex]);

    let operation = new OT.TextOperation(data.clientId);
    for (let line = 0; line < change.from.line; line++) operation.retain(ui.tmpCodeMirrorDoc.getLine(line).length + 1);
    operation.retain(change.from.ch);

    let offset = 0;
    if (change.removed.length !== 1 || change.removed[0] !== "") {
      for (let index = 0; index < change.removed.length; index++) {
        let text = change.removed[index];
        if (index !== 0) {
          operation.delete("\n");
          offset += 1;
        }

        operation.delete(text);
        offset += text.length;
      }
    }

    if (change.text.length !== 1 || change.text[0] !== "") {
      for (let index = 0; index < change.text.length; index++) {
        if (index !== 0) operation.insert("\n");
        operation.insert(change.text[index]);
      }
    }

    let beforeLength = (operation.ops[0].attributes.amount != null) ? operation.ops[0].attributes.amount : 0;
    operation.retain(ui.tmpCodeMirrorDoc.getValue().length - beforeLength - offset);

    if (operationToSend == null) operationToSend = operation.clone();
    else operationToSend = operationToSend.compose(operation);

    if (origin === "undo" || origin === "redo") undoRedo = true;
  }

  ui.texts.length = 0;
  if (operationToSend == null) return;

  if (! undoRedo) {
    if (ui.undoTimeout != null) {
      clearTimeout(ui.undoTimeout);
      ui.undoTimeout = null;
    }

    ui.undoStack.push(operationToSend.clone().invert());
    ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] += 1;
    if (ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] > 20) ui.undoQuantityByAction.push(0);
    else {
      ui.undoTimeout = window.setTimeout(() => {
        ui.undoTimeout = null;
        ui.undoQuantityByAction.push(0);
      }, 500);
    }

    ui.redoStack.length = 0;
    ui.redoQuantityByAction.length = 0;
  }

  if (ui.sentOperation == null) {
    socket.emit("edit:assets", info.assetId, "editText", operationToSend.serialize(), data.asset.document.operations.length, (err: string) => {
      if (err != null) { alert(err); SupClient.onDisconnected(); }
    });

    ui.sentOperation = operationToSend;
  } else {
    if (ui.pendingOperation != null) ui.pendingOperation = ui.pendingOperation.compose(operationToSend);
    else ui.pendingOperation = operationToSend;
  }
}

function hint(instance: any, callback: any) {
  let cursor = ui.editor.getDoc().getCursor();
  let token = ui.editor.getTokenAt(cursor);
  if (token.string === ".") token.start = token.end;

  let start = 0;
  for (let i = 0; i < cursor.line; i++) start += ui.editor.getDoc().getLine(i).length + 1;
  start += cursor.ch;

  // nextCompletion = { callback, cursor, token, start };
  // if(activeCompletion == null) startAutocomplete();
}
(<any>hint).async = true;

let hintCustomKeys = {
  "Up": (cm: any, commands: any) => { commands.moveFocus(-1); },
  "Down": (cm: any, commands: any) => { commands.moveFocus(1); },
  "Enter": (cm: any, commands: any) => { commands.pick(); },
  "Tab": (cm: any, commands: any) => { commands.pick(); },
  "Esc": (cm: any, commands: any) => { commands.close(); },
};

function scheduleCompletion() {
  if (ui.completionTimeout != null) clearTimeout(ui.completionTimeout);

  ui.completionTimeout = window.setTimeout(() => {
    (<any>ui.editor).showHint({ completeSingle: false, customKeys: hintCustomKeys, hint });
    ui.completionTimeout = null;
  }, 100);
}

function onUndo() {
  if (ui.undoStack.length === 0) return;

  if (ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] === 0) ui.undoQuantityByAction.pop();
  let undoQuantityByAction = ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1];

  for (let i = 0; i < undoQuantityByAction; i++) {
    let operationToUndo = ui.undoStack[ui.undoStack.length - 1];
    applyOperation(operationToUndo.clone(), "undo", true);

    ui.undoStack.pop()
    ui.redoStack.push(operationToUndo.invert());
  }

  if (ui.undoTimeout != null) {
    clearTimeout(ui.undoTimeout);
    ui.undoTimeout = null;
  }

  ui.redoQuantityByAction.push(ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1]);
  ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] = 0;
}

function onRedo() {
  if (ui.redoStack.length === 0) return;

  let redoQuantityByAction = ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1]
  for (let i = 0; i < redoQuantityByAction; i++) {
    let operationToRedo = ui.redoStack[ui.redoStack.length - 1];
    applyOperation(operationToRedo.clone(), "undo", true);

    ui.redoStack.pop()
    ui.undoStack.push(operationToRedo.invert());
  }

  if (ui.undoTimeout != null) {
    clearTimeout(ui.undoTimeout);
    ui.undoTimeout = null;

    ui.undoQuantityByAction.push(ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1]);
  }
  else ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] = ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1];

  ui.undoQuantityByAction.push(0);
  ui.redoQuantityByAction.pop();
}

// Load plugins
/*async.each(SupClient.pluginPaths.all, (pluginName, pluginCallback) => {
  if (pluginName === "sparklinlabs/typescript") { pluginCallback(); return; }

  let apiScript = document.createElement('script');
  apiScript.src = `/plugins/${pluginName}/api.js`;
  apiScript.addEventListener('load', () => { pluginCallback(); } );
  apiScript.addEventListener('error', () => { pluginCallback(); } );
  document.body.appendChild(apiScript);
}, (err) => {
  // Read API definitions
  let globalDefs = "";

  let actorComponentAccessors: string[] = [];
  for (let pluginName in SupAPI.contexts["typescript"].plugins) {
    let plugin = SupAPI.contexts["typescript"].plugins[pluginName];
    if (plugin.defs != null) globalDefs += plugin.defs;
    if (plugin.exposeActorComponent != null) actorComponentAccessors.push(`${plugin.exposeActorComponent.propertyName}: ${plugin.exposeActorComponent.className};`);
  }

  globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
  fileNames.push("lib.d.ts");
  files["lib.d.ts"] = { id: "lib.d.ts", text: globalDefs, version: "" };

  // Start
  start();
});*/

// Start
start();
