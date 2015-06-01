var OT = require("operational-transform");
window.CodeMirror = require("codemirror");
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
require("codemirror/addon/search/match-highlighter");
require("codemirror/addon/edit/matchtags");
require("codemirror/addon/edit/trailingspace");
require("codemirror/addon/edit/closetag"); // depends on xml-fol
require("codemirror/addon/fold/xml-fold");
require("codemirror/addon/selection/active-line");
require("codemirror/addon/hint/anyword-hint");
require("codemirror/keymap/sublime");
require("codemirror/keymap/emacs");
require("codemirror/keymap/vim");
require("codemirror/mode/htmlmixed/htmlmixed"); // load js, css, xm
require("codemirror/mode/jade/jade");
require("codemirror/mode/markdown/markdown"); // load xm"
require("codemirror/mode/coffeescript/coffeescript");
require("codemirror/mode/clike/clike");
var PerfectResize = require("perfect-resize");
var qs = require("querystring").parse(window.location.search.slice(1));
var info = { projectId: qs.project, assetId: qs.asset, line: qs.line, ch: qs.ch };
var data;
var ui = {};
var socket;
function start() {
    socket = SupClient.connect(info.projectId);
    socket.on("welcome", onWelcome);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    window.addEventListener("message", function (event) {
        if (event.data.type === "activate")
            ui.editor.focus();
        if (event.data.line != null && event.data.ch != null)
            ui.editor.getDoc().setCursor({ line: parseInt(event.data.line), ch: parseInt(event.data.ch) });
    });
    var extraKeys = {
        "F9": function () { },
        "Tab": function (cm) {
            if (cm.getSelection() !== "")
                cm.execCommand("indentMore");
            else
                cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "));
        },
        "Cmd-X": function () { document.execCommand("cut"); },
        "Cmd-C": function () { document.execCommand("copy"); },
        "Cmd-V": function () { document.execCommand("paste"); },
        "Ctrl-Z": function () { onUndo(); },
        "Cmd-Z": function () { onUndo(); },
        "Shift-Ctrl-Z": function () { onRedo(); },
        "Shift-Cmd-Z": function () { onRedo(); },
        "Ctrl-Y": function () { onRedo(); },
        "Cmd-Y": function () { onRedo(); },
        "Ctrl-S": function () {
            socket.emit("edit:assets", info.assetId, "saveText", function (err) { if (err != null) {
                alert(err);
                SupClient.onDisconnected();
            } });
        },
        "Cmd-S": function () {
            socket.emit("edit:assets", info.assetId, "saveText", function (err) { if (err != null) {
                alert(err);
                SupClient.onDisconnected();
            } });
        },
        "Ctrl-Space": "autocomplete",
        "Cmd-Space": "autocomplete",
        "Cmd-J": "toMatchingTag",
        "Ctrl-J": "toMatchingTag"
    };
    var textArea = document.querySelector(".code-editor");
    ui.editor = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true, matchBrackets: true, styleActiveLine: true, autoCloseBrackets: true,
        gutters: ["line-error-gutter", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        tabSize: 2, keyMap: "sublime",
        extraKeys: extraKeys,
        viewportMargin: Infinity,
        // mode: "", no default mode
        readOnly: true
    });
    ui.tmpCodeMirrorDoc = new CodeMirror.Doc("");
    ui.texts = [];
    ui.undoStack = [];
    ui.undoQuantityByAction = [0];
    ui.redoStack = [];
    ui.redoQuantityByAction = [];
    ui.editor.on("beforeChange", function (instance, change) {
        if (change.origin === "setValue" || change.origin === "network")
            return;
        var lastText = instance.getDoc().getValue();
        if (lastText !== ui.texts[ui.texts.length - 1])
            ui.texts.push(lastText);
    });
    ui.editor.on("changes", onEditText);
    // (<any>CodeMirror).commands.autocomplete = (cm: CodeMirror.Editor) => { scheduleCompletion(); };
    /*(<any>ui.editor).on("keyup", (instance: any, event: any) => {
      clearInfoPopup();
  
      // Ignore Ctrl, Cmd, Escape, Return, Tab, arrow keys
      if (event.ctrlKey || event.metaKey || [27, 9, 13, 37, 38, 39, 40, 16].indexOf(event.keyCode) !== -1) return;
  
      // If the completion popup is active, the hint() method will automatically
      // call for more autocomplete, so we don't need to do anything here.
      if ((<any>ui.editor).state.completionActive != null && (<any>ui.editor).state.completionActive.active()) return;
      scheduleCompletion();
    });*/
    ui.infoElement = document.createElement("div");
    ui.infoElement.classList.add("popup-info");
    /*document.onmouseout = (event) => { clearInfoPopup(); }
    document.onmousemove = (event) => {
      clearInfoPopup();
  
      ui.infoTimeout = window.setTimeout(() => {
        ui.infoPosition = ui.editor.coordsChar({ left: event.clientX, top: event.clientY });
        if ((<any>ui.infoPosition).outside) return;
  
        let token = ui.editor.getTokenAt(ui.infoPosition);
        let start = 0;
        for (let i = 0; i < ui.infoPosition.line; i++) start += ui.editor.getDoc().getLine(i).length + 1;
        start += ui.infoPosition.ch;
  
        ui.infoTimeout = null;
        typescriptWorker.postMessage({
          type: "getQuickInfoAt",
          name: fileNamesByScriptId[info.assetId],
          start
        });
      }, 200);
    };*/
    var nwDispatcher = window.nwDispatcher;
    if (nwDispatcher != null) {
        var gui = nwDispatcher.requireNwGui();
        var menu = new gui.Menu();
        menu.append(new gui.MenuItem({ label: "Cut (Ctrl-X)", click: function () { document.execCommand("cut"); } }));
        menu.append(new gui.MenuItem({ label: "Copy (Ctrl-C)", click: function () { document.execCommand("copy"); } }));
        menu.append(new gui.MenuItem({ label: "Paste (Ctrl-V)", click: function () { document.execCommand("paste"); } }));
        document.body.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            menu.popup(event.screenX - gui.Window.get().x, event.screenY - gui.Window.get().y);
            return false;
        });
    }
    // Error pane
    ui.errorPane = document.querySelector(".error-pane");
    ui.errorPaneStatus = ui.errorPane.querySelector(".status");
    ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
    ui.errorsTBody = ui.errorPane.querySelector(".errors tbody");
    ui.errorsTBody.addEventListener("click", onErrorTBodyClick);
    var errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
    errorPaneResizeHandle.on("drag", function () { ui.editor.refresh(); });
    var errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");
    ui.errorPaneStatus.addEventListener("click", function () {
        var collapsed = ui.errorPane.classList.toggle("collapsed");
        errorPaneToggleButton.textContent = collapsed ? "+" : "–";
        errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
        ui.editor.refresh();
    });
    ui.editor.focus();
}
// Network callbacks
function onWelcome(clientId) {
    data = { clientId: clientId, assetsById: {} };
    data.projectClient = new SupClient.ProjectClient(socket);
    data.projectClient.subEntries(entriesSubscriber);
}
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "ftext")
                return;
            // var scriptName = `${data.projectClient.entries.getPathFromId(entry.id)}.ts`;
            // fileNames.push(scriptName);
            // fileNamesByScriptId[entry.id] = scriptName;
            data.projectClient.subAsset(entry.id, "ftext", scriptSubscriber);
        });
    },
    onEntryAdded: function (newEntry, parentId, index) {
        if (newEntry.type !== "ftext")
            return;
        /* let scriptName = `${data.projectClient.entries.getPathFromId(newEntry.id)}.ts`;
    
        let i = 0;
        data.projectClient.entries.walk((entry) => {
          if (entry.type !== "ftext") return;
          if (entry.id === newEntry.id) fileNames.splice(i, 0, scriptName);
          i++;
        });
        fileNamesByScriptId[newEntry.id] = scriptName;*/
        data.projectClient.subAsset(newEntry.id, "ftext", scriptSubscriber);
    },
    onEntryMoved: function (id, parentId, index) {
        var entry = data.projectClient.entries.byId[id];
        if (entry.type !== "ftext")
            return;
        /*let oldFileName = fileNamesByScriptId[id];
    
        let newFileName = `${data.projectClient.entries.getPathFromId(id)}.ts`;
    
        fileNames.splice(fileNames.indexOf(oldFileName), 1);
        let i = 0;
        data.projectClient.entries.walk((entry) => {
          if (entry.type !== "ftext") return;
          if (entry.id === id) fileNames.splice(i, 0, newFileName);
          i++;
        });
    
        fileNamesByScriptId[id] = newFileName;
        let file = files[oldFileName];
        files[newFileName] = file;
        if (newFileName !== oldFileName) delete files[oldFileName];
    
        typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
        typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: fileNames.indexOf(newFileName), file });
        scheduleErrorCheck();*/
    },
    onSetEntryProperty: function (id, key, value) {
        var entry = data.projectClient.entries.byId[id];
        if (entry.type !== "ftext" || key !== "name")
            return;
        /*let oldScriptName = fileNamesByScriptId[id];
        let newScriptName = `${data.projectClient.entries.getPathFromId(entry.id)}.ts`;
        if (newScriptName === oldScriptName) return;
    
        let scriptIndex = fileNames.indexOf(oldScriptName);
        fileNames[scriptIndex] = newScriptName;
        fileNamesByScriptId[id] = newScriptName;
        files[newScriptName] = files[oldScriptName];
        delete files[oldScriptName];*/
    },
    onEntryTrashed: function (id) {
        // let fileName = fileNamesByScriptId[id];
        // if (fileName == null) return;
        /*fileNames.splice(fileNames.indexOf(fileName), 1);
        delete files[fileName];
        delete fileNamesByScriptId[id];
    
        typescriptWorker.postMessage({ type: "removeFile", fileName });
        scheduleErrorCheck();*/
    },
};
var allScriptsReceived = false;
var scriptSubscriber = {
    onAssetReceived: function (err, asset) {
        data.assetsById[asset.id] = asset;
        /*let fileName = `${data.projectClient.entries.getPathFromId(asset.id)}.ts`;
        let file = { id: asset.id, text: asset.pub.text, version: asset.pub.revisionId.toString() }
        files[fileName] = file;*/
        if (asset.id === info.assetId) {
            data.asset = asset;
            ui.editor.getDoc().setValue(data.asset.pub.draft);
            ui.editor.getDoc().clearHistory();
            ui.editor.setOption("readOnly", false);
            if (info.line != null)
                ui.editor.getDoc().setCursor({ line: parseInt(info.line), ch: parseInt(info.ch) });
            // fText specific settings
            // let editorSettings = data.asset.pub.editorSettings;
            ui.editor.setOption("theme", data.asset.pub.theme);
        }
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== info.assetId) {
            /*if (command === "saveText") {
              let fileName = `${data.projectClient.entries.getPathFromId(id)}.ts`;
              let asset = data.assetsById[id];
              let file = files[fileName];
              file.text = asset.pub.text;
              file.version = asset.pub.revisionId.toString();
      
              typescriptWorker.postMessage({ type: "updateFile", fileName, text: file.text, version: file.version });
              scheduleErrorCheck();
            }*/
            return;
        }
        if (onAssetCommands[command] != null)
            onAssetCommands[command].apply(data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== info.assetId)
            return;
        if (ui.undoTimeout != null)
            clearTimeout(ui.undoTimeout);
        // if (ui.errorCheckTimeout != null) clearTimeout(ui.errorCheckTimeout);
        // if (ui.completionTimeout != null) clearTimeout(ui.completionTimeout);
        SupClient.onAssetTrashed();
    },
};
var onAssetCommands = {};
onAssetCommands.editText = function (operationData) {
    if (data.clientId === operationData.userId) {
        if (ui.pendingOperation != null) {
            socket.emit("edit:assets", info.assetId, "editText", ui.pendingOperation.serialize(), data.asset.document.operations.length, function (err) {
                if (err != null) {
                    alert(err);
                    SupClient.onDisconnected();
                }
            });
            ui.sentOperation = ui.pendingOperation;
            ui.pendingOperation = null;
        }
        else
            ui.sentOperation = null;
        return;
    }
    // Transform operation and local changes
    var operation = new OT.TextOperation();
    operation.deserialize(operationData);
    if (ui.sentOperation != null) {
        _a = ui.sentOperation.transform(operation), ui.sentOperation = _a[0], operation = _a[1];
        if (ui.pendingOperation != null)
            _b = ui.pendingOperation.transform(operation), ui.pendingOperation = _b[0], operation = _b[1];
    }
    ui.undoStack = transformStack(ui.undoStack, operation);
    ui.redoStack = transformStack(ui.redoStack, operation);
    applyOperation(operation.clone(), "network", false);
    var _a, _b;
};
function transformStack(stack, operation) {
    if (stack.length === 0)
        return stack;
    var newStack = [];
    for (var i = stack.length - 1; i > 0; i--) {
        var pair = stack[i].transform(operation);
        newStack.push(pair[0]);
        operation = pair[1];
    }
    return newStack.reverse();
}
function applyOperation(operation, origin, moveCursor) {
    var cursorPosition = 0;
    var line = 0;
    for (var _i = 0, _a = operation.ops; _i < _a.length; _i++) {
        var op = _a[_i];
        switch (op.type) {
            case "retain": {
                while (true) {
                    if (op.attributes.amount <= ui.editor.getDoc().getLine(line).length - cursorPosition)
                        break;
                    op.attributes.amount -= ui.editor.getDoc().getLine(line).length + 1 - cursorPosition;
                    cursorPosition = 0;
                    line++;
                }
                cursorPosition += op.attributes.amount;
                break;
            }
            case "insert": {
                var cursor = ui.editor.getDoc().getCursor();
                var texts = op.attributes.text.split("\n");
                for (var textIndex = 0; textIndex < texts.length; textIndex++) {
                    var text = texts[textIndex];
                    if (textIndex !== texts.length - 1)
                        text += "\n";
                    ui.editor.replaceRange(text, { line: line, ch: cursorPosition }, null, origin);
                    cursorPosition += text.length;
                    if (textIndex !== texts.length - 1) {
                        cursorPosition = 0;
                        line++;
                    }
                }
                if (line === cursor.line && cursorPosition === cursor.ch) {
                    if (!operation.gotPriority(data.clientId)) {
                        for (var i = 0; i < op.attributes.text.length; i++)
                            ui.editor.execCommand("goCharLeft");
                    }
                }
                if (moveCursor)
                    ui.editor.setCursor(line, cursorPosition);
                break;
            }
            case "delete": {
                var texts = op.attributes.text.split("\n");
                for (var textIndex = 0; textIndex < texts.length; textIndex++) {
                    var text = texts[textIndex];
                    if (texts[textIndex + 1] != null)
                        ui.editor.replaceRange("", { line: line, ch: cursorPosition }, { line: line + 1, ch: 0 }, origin);
                    else
                        ui.editor.replaceRange("", { line: line, ch: cursorPosition }, { line: line, ch: cursorPosition + text.length }, origin);
                    if (moveCursor)
                        ui.editor.setCursor(line, cursorPosition);
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
function refreshErrors(errors) {
    // Remove all previous erros
    for (var _i = 0, _a = ui.editor.getDoc().getAllMarks(); _i < _a.length; _i++) {
        var textMarker = _a[_i];
        if (textMarker.className !== "line-error")
            continue;
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
    var selfErrorsCount = 0;
    var lastSelfErrorRow = null;
    // Display new ones
    for (var _b = 0; _b < errors.length; _b++) {
        var error = errors[_b];
        var errorRow = document.createElement("tr");
        //(<any>errorRow.dataset).assetId = files[error.file].id;
        errorRow.dataset.line = error.position.line;
        errorRow.dataset.character = error.position.character;
        var positionCell = document.createElement("td");
        positionCell.textContent = (error.position.line + 1).toString();
        errorRow.appendChild(positionCell);
        var messageCell = document.createElement("td");
        messageCell.textContent = error.message;
        errorRow.appendChild(messageCell);
        var scriptCell = document.createElement("td");
        scriptCell.textContent = error.file.substring(0, error.file.length - 3);
        errorRow.appendChild(scriptCell);
        /*if (error.file !== fileNamesByScriptId[info.assetId]) {
          ui.errorsTBody.appendChild(errorRow);
          continue;
        }*/
        ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
        lastSelfErrorRow = errorRow;
        selfErrorsCount++;
        var line = error.position.line;
        ui.editor.getDoc().markText({ line: line, ch: error.position.character }, { line: line, ch: error.position.character + error.length }, { className: "line-error" });
        var gutter = document.createElement("div");
        gutter.className = "line-error-gutter";
        gutter.innerHTML = "●";
        ui.editor.setGutterMarker(line, "line-error-gutter", gutter);
    }
    var otherErrorsCount = errors.length - selfErrorsCount;
    if (selfErrorsCount > 0) {
        if (otherErrorsCount == 0)
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "");
        else
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "") + " in this script, " + otherErrorsCount + " in other scripts";
    }
    else {
        ui.errorPaneInfo.textContent = errors.length + " error" + (errors.length > 1 ? "s" : "") + " in other scripts";
    }
}
function onErrorTBodyClick(event) {
    var target = event.target;
    while (true) {
        if (target.tagName === "TBODY")
            return;
        if (target.tagName === "TR")
            break;
        target = target.parentElement;
    }
    var assetId = target.dataset.assetId;
    var line = target.dataset.line;
    var character = target.dataset.character;
    if (assetId === info.assetId) {
        ui.editor.getDoc().setCursor({ line: parseInt(line), ch: parseInt(character) });
        ui.editor.focus();
    }
    else {
        var origin = window.location.origin;
        if (window.parent != null)
            window.parent.postMessage({ type: "openEntry", id: assetId, options: { line: line, ch: character } }, origin);
    }
}
var localVersionNumber = 0;
function onEditText(instance, changes) {
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
    var undoRedo = false;
    var operationToSend;
    for (var changeIndex = 0; changeIndex < changes.length; changeIndex++) {
        var change = changes[changeIndex];
        var origin = change.origin;
        // Modification from an other person
        if (origin === "setValue" || origin === "network")
            continue;
        ui.tmpCodeMirrorDoc.setValue(ui.texts[changeIndex]);
        var operation = new OT.TextOperation(data.clientId);
        for (var line = 0; line < change.from.line; line++)
            operation.retain(ui.tmpCodeMirrorDoc.getLine(line).length + 1);
        operation.retain(change.from.ch);
        var offset = 0;
        if (change.removed.length !== 1 || change.removed[0] !== "") {
            for (var index = 0; index < change.removed.length; index++) {
                var text = change.removed[index];
                if (index !== 0) {
                    operation.delete("\n");
                    offset += 1;
                }
                operation.delete(text);
                offset += text.length;
            }
        }
        if (change.text.length !== 1 || change.text[0] !== "") {
            for (var index = 0; index < change.text.length; index++) {
                if (index !== 0)
                    operation.insert("\n");
                operation.insert(change.text[index]);
            }
        }
        var beforeLength = (operation.ops[0].attributes.amount != null) ? operation.ops[0].attributes.amount : 0;
        operation.retain(ui.tmpCodeMirrorDoc.getValue().length - beforeLength - offset);
        if (operationToSend == null)
            operationToSend = operation.clone();
        else
            operationToSend = operationToSend.compose(operation);
        if (origin === "undo" || origin === "redo")
            undoRedo = true;
    }
    ui.texts.length = 0;
    if (operationToSend == null)
        return;
    if (!undoRedo) {
        if (ui.undoTimeout != null) {
            clearTimeout(ui.undoTimeout);
            ui.undoTimeout = null;
        }
        ui.undoStack.push(operationToSend.clone().invert());
        ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] += 1;
        if (ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] > 20)
            ui.undoQuantityByAction.push(0);
        else {
            ui.undoTimeout = window.setTimeout(function () {
                ui.undoTimeout = null;
                ui.undoQuantityByAction.push(0);
            }, 500);
        }
        ui.redoStack.length = 0;
        ui.redoQuantityByAction.length = 0;
    }
    if (ui.sentOperation == null) {
        socket.emit("edit:assets", info.assetId, "editText", operationToSend.serialize(), data.asset.document.operations.length, function (err) {
            if (err != null) {
                alert(err);
                SupClient.onDisconnected();
            }
        });
        ui.sentOperation = operationToSend;
    }
    else {
        if (ui.pendingOperation != null)
            ui.pendingOperation = ui.pendingOperation.compose(operationToSend);
        else
            ui.pendingOperation = operationToSend;
    }
}
function hint(instance, callback) {
    var cursor = ui.editor.getDoc().getCursor();
    var token = ui.editor.getTokenAt(cursor);
    if (token.string === ".")
        token.start = token.end;
    var start = 0;
    for (var i = 0; i < cursor.line; i++)
        start += ui.editor.getDoc().getLine(i).length + 1;
    start += cursor.ch;
    // nextCompletion = { callback, cursor, token, start };
    // if(activeCompletion == null) startAutocomplete();
}
hint.async = true;
var hintCustomKeys = {
    "Up": function (cm, commands) { commands.moveFocus(-1); },
    "Down": function (cm, commands) { commands.moveFocus(1); },
    "Enter": function (cm, commands) { commands.pick(); },
    "Tab": function (cm, commands) { commands.pick(); },
    "Esc": function (cm, commands) { commands.close(); },
};
function scheduleCompletion() {
    if (ui.completionTimeout != null)
        clearTimeout(ui.completionTimeout);
    ui.completionTimeout = window.setTimeout(function () {
        ui.editor.showHint({ completeSingle: false, customKeys: hintCustomKeys, hint: hint });
        ui.completionTimeout = null;
    }, 100);
}
function onUndo() {
    if (ui.undoStack.length === 0)
        return;
    if (ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] === 0)
        ui.undoQuantityByAction.pop();
    var undoQuantityByAction = ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1];
    for (var i = 0; i < undoQuantityByAction; i++) {
        var operationToUndo = ui.undoStack[ui.undoStack.length - 1];
        applyOperation(operationToUndo.clone(), "undo", true);
        ui.undoStack.pop();
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
    if (ui.redoStack.length === 0)
        return;
    var redoQuantityByAction = ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1];
    for (var i = 0; i < redoQuantityByAction; i++) {
        var operationToRedo = ui.redoStack[ui.redoStack.length - 1];
        applyOperation(operationToRedo.clone(), "undo", true);
        ui.redoStack.pop();
        ui.undoStack.push(operationToRedo.invert());
    }
    if (ui.undoTimeout != null) {
        clearTimeout(ui.undoTimeout);
        ui.undoTimeout = null;
        ui.undoQuantityByAction.push(ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1]);
    }
    else
        ui.undoQuantityByAction[ui.undoQuantityByAction.length - 1] = ui.redoQuantityByAction[ui.redoQuantityByAction.length - 1];
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
