var OT = require("operational-transform");
window.CodeMirror = require("codemirror");
require("codemirror/addon/search/search");
require("codemirror/addon/search/searchcursor");
require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/comment/comment");
require("codemirror/addon/hint/show-hint");
require("codemirror/addon/selection/active-line");
require("codemirror/keymap/sublime");
require("codemirror/mode/javascript/javascript");
require("codemirror/mode/clike/clike");
// added for fText plugin
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
require("../codemirror-linters/lint");
window.CSSLint = require("csslint").CSSLint;
require("codemirror/addon/lint/css-lint");
window.JSHINT = require("jshint").JSHINT;
require("codemirror/addon/lint/javascript-lint");
window.jsonlint = require("jsonlint");
require("../codemirror-linters/json-lint");
window.csonparser = require("cson-parser");
require("../codemirror-linters/cson-lint");
window.jade = require("jade");
require("../codemirror-linters/jade-lint");
window.stylus = require("stylus");
require("../codemirror-linters/stylus-lint");
window.jsyaml = require("js-yaml");
require("../codemirror-linters/yaml-lint");
require("codemirror/keymap/emacs");
require("codemirror/keymap/vim");
require("codemirror/mode/htmlmixed/htmlmixed"); // load js, css, xml
require("codemirror/mode/jade/jade");
require("codemirror/mode/markdown/markdown"); // load xml
require("codemirror/mode/coffeescript/coffeescript");
require("codemirror/mode/stylus/stylus");
require("codemirror/mode/yaml/yaml");
// /added for fText plugin
var fTextEditorWidget = (function () {
    function fTextEditorWidget(projectClient, clientId, textArea, options) {
        var _this = this;
        this.tmpCodeMirrorDoc = new CodeMirror.Doc("");
        this.texts = [];
        this.undoStack = [];
        this.undoQuantityByAction = [0];
        this.redoStack = [];
        this.redoQuantityByAction = [0];
        this.useSoftTab = true; // use spaces as tabs = true (indent with tabs = false)
        this.beforeChange = function (instance, change) {
            if (change.origin === "setValue" || change.origin === "network")
                return;
            var lastText = instance.getDoc().getValue();
            if (lastText !== _this.texts[_this.texts.length - 1])
                _this.texts.push(lastText);
        };
        this.edit = function (instance, changes) {
            if (_this.editCallback != null)
                _this.editCallback(_this.codeMirrorInstance.getDoc().getValue(), changes[0].origin);
            var undoRedo = false;
            var operationToSend;
            for (var changeIndex = 0; changeIndex < changes.length; changeIndex++) {
                var change = changes[changeIndex];
                var origin = change.origin;
                // Modification from an other person
                if (origin === "setValue" || origin === "network")
                    continue;
                _this.tmpCodeMirrorDoc.setValue(_this.texts[changeIndex]);
                var operation = new OT.TextOperation(_this.clientId);
                for (var line = 0; line < change.from.line; line++)
                    operation.retain(_this.tmpCodeMirrorDoc.getLine(line).length + 1);
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
                operation.retain(_this.tmpCodeMirrorDoc.getValue().length - beforeLength - offset);
                if (operationToSend == null)
                    operationToSend = operation.clone();
                else
                    operationToSend = operationToSend.compose(operation);
                if (origin === "undo" || origin === "redo")
                    undoRedo = true;
            }
            _this.texts.length = 0;
            if (operationToSend == null)
                return;
            if (!undoRedo) {
                if (_this.undoTimeout != null) {
                    clearTimeout(_this.undoTimeout);
                    _this.undoTimeout = null;
                }
                _this.undoStack.push(operationToSend.clone().invert());
                _this.undoQuantityByAction[_this.undoQuantityByAction.length - 1] += 1;
                if (_this.undoQuantityByAction[_this.undoQuantityByAction.length - 1] > 20)
                    _this.undoQuantityByAction.push(0);
                else {
                    _this.undoTimeout = window.setTimeout(function () {
                        _this.undoTimeout = null;
                        _this.undoQuantityByAction.push(0);
                    }, 500);
                }
                _this.redoStack.length = 0;
                _this.redoQuantityByAction.length = 0;
            }
            if (_this.sentOperation == null) {
                _this.sendOperationCallback(operationToSend.serialize());
                _this.sentOperation = operationToSend;
            }
            else {
                if (_this.pendingOperation != null)
                    _this.pendingOperation = _this.pendingOperation.compose(operationToSend);
                else
                    _this.pendingOperation = operationToSend;
            }
        };
        this.onResourceReceived = function (resourceId, resource) {
            _this.textEditorResource = resource;
            _this.codeMirrorInstance.setOption("tabSize", resource.pub.tabSize);
            _this.codeMirrorInstance.setOption("indentUnit", resource.pub.tabSize);
            _this.codeMirrorInstance.setOption("indentWithTabs", resource.pub.indentWithTabs);
            _this.useSoftTab = !resource.pub.indentWithTabs;
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            switch (propertyName) {
                case "tabSize":
                    _this.codeMirrorInstance.setOption("tabSize", _this.textEditorResource.pub.tabSize);
                    _this.codeMirrorInstance.setOption("indentUnit", _this.textEditorResource.pub.tabSize);
                    break;
                case "indentWithTabs":
                    _this.useSoftTab = !_this.textEditorResource.pub.indentWithTabs;
                    _this.codeMirrorInstance.setOption("indentWithTabs", _this.textEditorResource.pub.indentWithTabs);
                    break;
            }
        };
        var extraKeys = {
            "F9": function () { },
            "Tab": function (cm) {
                if (cm.getSelection() !== "")
                    cm.execCommand("indentMore");
                else {
                    if (_this.useSoftTab)
                        cm.execCommand("insertSoftTab");
                    else
                        cm.execCommand("insertTab");
                }
            },
            "Cmd-X": function () { document.execCommand("cut"); },
            "Cmd-C": function () { document.execCommand("copy"); },
            "Cmd-V": function () { document.execCommand("paste"); },
            "Ctrl-Z": function () { _this.undo(); },
            "Cmd-Z": function () { _this.undo(); },
            "Shift-Ctrl-Z": function () { _this.redo(); },
            "Shift-Cmd-Z": function () { _this.redo(); },
            "Ctrl-Y": function () { _this.redo(); },
            "Cmd-Y": function () { _this.redo(); },
            "Ctrl-S": function () { _this.saveCallback(); },
            "Cmd-S": function () { _this.saveCallback(); }
        };
        if (options.extraKeys != null) {
            for (var keyName in options.extraKeys) {
                extraKeys[keyName] = options.extraKeys[keyName];
            }
        }
        this.editCallback = options.editCallback;
        this.sendOperationCallback = options.sendOperationCallback;
        this.saveCallback = options.saveCallback;
        var editorConfig = {
            // theme: "monokai",
            lineNumbers: true, matchBrackets: true, styleActiveLine: true, autoCloseBrackets: true,
            gutters: ["CodeMirror-linenumbers"],
            indentWithTabs: false, indentUnit: 2, tabSize: 2,
            extraKeys: extraKeys, keyMap: "sublime",
            viewportMargin: Infinity,
            mode: options.mode,
            readOnly: true
        };
        this.codeMirrorInstance = CodeMirror.fromTextArea(textArea, editorConfig);
        this.codeMirrorInstance.on("changes", this.edit);
        this.codeMirrorInstance.on("beforeChange", this.beforeChange);
        this.clientId = clientId;
        projectClient.subResource("fTextSettings", this);
    }
    fTextEditorWidget.prototype.setText = function (text) {
        this.codeMirrorInstance.getDoc().setValue(text);
        this.codeMirrorInstance.getDoc().clearHistory();
        this.codeMirrorInstance.setOption("readOnly", false);
        this.codeMirrorInstance.focus();
    };
    fTextEditorWidget.prototype.receiveEditText = function (operationData) {
        if (this.clientId === operationData.userId) {
            if (this.pendingOperation != null) {
                this.sendOperationCallback(this.pendingOperation.serialize());
                this.sentOperation = this.pendingOperation;
                this.pendingOperation = null;
            }
            else
                this.sentOperation = null;
            return;
        }
        // Transform operation and local changes
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        if (this.sentOperation != null) {
            _a = this.sentOperation.transform(operation), this.sentOperation = _a[0], operation = _a[1];
            if (this.pendingOperation != null)
                _b = this.pendingOperation.transform(operation), this.pendingOperation = _b[0], operation = _b[1];
        }
        this.undoStack = transformStack(this.undoStack, operation);
        this.redoStack = transformStack(this.redoStack, operation);
        this.applyOperation(operation.clone(), "network", false);
        var _a, _b;
    };
    fTextEditorWidget.prototype.applyOperation = function (operation, origin, moveCursor) {
        var cursorPosition = 0;
        var line = 0;
        for (var _i = 0, _a = operation.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op.type) {
                case "retain": {
                    while (true) {
                        if (op.attributes.amount <= this.codeMirrorInstance.getDoc().getLine(line).length - cursorPosition)
                            break;
                        op.attributes.amount -= this.codeMirrorInstance.getDoc().getLine(line).length + 1 - cursorPosition;
                        cursorPosition = 0;
                        line++;
                    }
                    cursorPosition += op.attributes.amount;
                    break;
                }
                case "insert": {
                    var cursor = this.codeMirrorInstance.getDoc().getCursor();
                    var texts = op.attributes.text.split("\n");
                    for (var textIndex = 0; textIndex < texts.length; textIndex++) {
                        var text = texts[textIndex];
                        if (textIndex !== texts.length - 1)
                            text += "\n";
                        this.codeMirrorInstance.replaceRange(text, { line: line, ch: cursorPosition }, null, origin);
                        cursorPosition += text.length;
                        if (textIndex !== texts.length - 1) {
                            cursorPosition = 0;
                            line++;
                        }
                    }
                    if (line === cursor.line && cursorPosition === cursor.ch) {
                        if (!operation.gotPriority(this.clientId)) {
                            for (var i = 0; i < op.attributes.text.length; i++)
                                this.codeMirrorInstance.execCommand("goCharLeft");
                        }
                    }
                    if (moveCursor)
                        this.codeMirrorInstance.setCursor(line, cursorPosition);
                    //use this way insted ? this.codeMirrorInstance.getDoc().setCursor({ line, ch: cursorPosition });
                    break;
                }
                case "delete": {
                    var texts = op.attributes.text.split("\n");
                    for (var textIndex = 0; textIndex < texts.length; textIndex++) {
                        var text = texts[textIndex];
                        if (texts[textIndex + 1] != null)
                            this.codeMirrorInstance.replaceRange("", { line: line, ch: cursorPosition }, { line: line + 1, ch: 0 }, origin);
                        else
                            this.codeMirrorInstance.replaceRange("", { line: line, ch: cursorPosition }, { line: line, ch: cursorPosition + text.length }, origin);
                        if (moveCursor)
                            this.codeMirrorInstance.setCursor(line, cursorPosition);
                    }
                    break;
                }
            }
        }
    };
    fTextEditorWidget.prototype.undo = function () {
        if (this.undoStack.length === 0)
            return;
        if (this.undoQuantityByAction[this.undoQuantityByAction.length - 1] === 0)
            this.undoQuantityByAction.pop();
        var undoQuantityByAction = this.undoQuantityByAction[this.undoQuantityByAction.length - 1];
        for (var i = 0; i < undoQuantityByAction; i++) {
            var operationToUndo = this.undoStack[this.undoStack.length - 1];
            this.applyOperation(operationToUndo.clone(), "undo", true);
            this.undoStack.pop();
            this.redoStack.push(operationToUndo.invert());
        }
        if (this.undoTimeout != null) {
            clearTimeout(this.undoTimeout);
            this.undoTimeout = null;
        }
        this.redoQuantityByAction.push(this.undoQuantityByAction[this.undoQuantityByAction.length - 1]);
        this.undoQuantityByAction[this.undoQuantityByAction.length - 1] = 0;
    };
    fTextEditorWidget.prototype.redo = function () {
        if (this.redoStack.length === 0)
            return;
        var redoQuantityByAction = this.redoQuantityByAction[this.redoQuantityByAction.length - 1];
        for (var i = 0; i < redoQuantityByAction; i++) {
            var operationToRedo = this.redoStack[this.redoStack.length - 1];
            this.applyOperation(operationToRedo.clone(), "undo", true);
            this.redoStack.pop();
            this.undoStack.push(operationToRedo.invert());
        }
        if (this.undoTimeout != null) {
            clearTimeout(this.undoTimeout);
            this.undoTimeout = null;
            this.undoQuantityByAction.push(this.redoQuantityByAction[this.redoQuantityByAction.length - 1]);
        }
        else
            this.undoQuantityByAction[this.undoQuantityByAction.length - 1] = this.redoQuantityByAction[this.redoQuantityByAction.length - 1];
        this.undoQuantityByAction.push(0);
        this.redoQuantityByAction.pop();
    };
    fTextEditorWidget.prototype.clear = function () {
        if (this.undoTimeout != null)
            clearTimeout(this.undoTimeout);
    };
    return fTextEditorWidget;
})();
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
module.exports = fTextEditorWidget;
