var ts = require("typescript");
var fuzzy = require("fuzzy");
var scripts;
var compilerOptions = { target: 1 /* ES5 */ };
var host = {
    getScriptFileNames: function () { return scripts.fileNames; },
    getScriptVersion: function (fileName) { return scripts.files[fileName].version; },
    getScriptSnapshot: function (fileName) { return ts.ScriptSnapshot.fromString(scripts.files[fileName].text); },
    getCurrentDirectory: function () { return ""; },
    getCompilationSettings: function () { return compilerOptions; },
    getDefaultLibFileName: function () { return "lib.d.ts"; }
};
var service;
onmessage = function (event) {
    if (event.data.type !== "setup" && service == null)
        return;
    switch (event.data.type) {
        case "setup":
            scripts = { fileNames: event.data.fileNames, files: event.data.files };
            service = ts.createLanguageService(host, ts.createDocumentRegistry());
            break;
        case "updateFile":
            var script = scripts.files[event.data.fileName];
            script.text = event.data.text;
            script.version = event.data.version;
            break;
        case "addFile":
            scripts.fileNames.splice(event.data.index, 0, event.data.fileName);
            scripts.files[event.data.fileName] = event.data.file;
            break;
        case "removeFile":
            scripts.fileNames.splice(scripts.fileNames.indexOf(event.data.fileName), 1);
            delete scripts.files[event.data.fileName];
            break;
        case "checkForErrors":
            var tsErrors;
            try {
                tsErrors = ts.getPreEmitDiagnostics(service.getProgram());
            }
            catch (e) {
                postMessage({ type: "errors", errors: [{ file: "", position: { line: 0, character: 1 }, length: 0, message: e.message }] });
                return;
            }
            var errors = tsErrors.map(function (e) {
                return {
                    file: e.file.fileName, length: e.length, message: e.messageText,
                    position: e.file.getLineAndCharacterOfPosition(e.start)
                };
            });
            postMessage({ type: "errors", errors: errors });
            break;
        case "getCompletionAt":
            var list = [];
            if (event.data.tokenString !== "" && event.data.tokenString !== ";") {
                var completions = service.getCompletionsAtPosition(event.data.name, event.data.start);
                if (completions != null) {
                    var rawList = [];
                    for (var _i = 0, _a = completions.entries; _i < _a.length; _i++) {
                        var completion = _a[_i];
                        rawList.push(completion.name);
                    }
                    rawList.sort();
                    event.data.tokenString = (event.data.tokenString !== ".") ? event.data.tokenString : "";
                    var results = fuzzy.filter(event.data.tokenString, rawList);
                    for (var _b = 0; _b < results.length; _b++) {
                        var result = results[_b];
                        var details = service.getCompletionEntryDetails(event.data.name, event.data.start, result.original);
                        var kind = details.kind;
                        var info_1 = "";
                        if (["class", "module", "interface", "keyword"].indexOf(kind) === -1)
                            info_1 = ts.displayPartsToString(details.displayParts);
                        list.push({ text: result.original, kind: kind, name: details.name, info: info_1 });
                    }
                }
            }
            postMessage({ type: "completion", list: list });
            break;
        case "getQuickInfoAt":
            var info = service.getQuickInfoAtPosition(event.data.name, event.data.start);
            if (info != null)
                postMessage({ type: "quickInfo", text: ts.displayPartsToString(info.displayParts) });
            break;
        default:
            throw new Error("Unexpected message type: " + event.data.type);
    }
};
