var ts = require("typescript");
function createLanguageService(fileNames, scripts, libSource, compilerOptions) {
    if (compilerOptions === void 0) { compilerOptions = {}; }
    if (compilerOptions.target == null)
        compilerOptions.target = 1 /* ES5 */;
    fileNames.splice(0, 0, "lib.d.ts");
    // Create the language service host to allow the LS to communicate with the host
    var servicesHost = {
        getScriptFileNames: function () { return fileNames; },
        getScriptVersion: function (fileName) { return "0"; },
        getScriptSnapshot: function (fileName) {
            if (fileName === "lib.d.ts")
                return ts.ScriptSnapshot.fromString(libSource);
            else
                return ts.ScriptSnapshot.fromString(scripts[fileName].text);
        },
        getCurrentDirectory: function () { return ""; },
        getCompilationSettings: function () { return compilerOptions; },
        getDefaultLibFileName: function () { return "lib.d.ts"; },
    };
    // Create the language service files
    return ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
}
exports.default = createLanguageService;
