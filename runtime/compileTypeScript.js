var ts = require("typescript");
function compileTypeScript(sourceFileNames, sourceFiles, libSource, compilerOptions) {
    if (compilerOptions === void 0) { compilerOptions = {}; }
    if (compilerOptions.target == null)
        compilerOptions.target = 1 /* ES5 */;
    var script = "";
    var files = [];
    var sourceMaps = {};
    // Create a compilerHost object to allow the compiler to read and write files
    var compilerHost = {
        getSourceFile: function (filename, languageVersion) {
            if (sourceFiles[filename] != null) {
                return ts.createSourceFile(filename, sourceFiles[filename], compilerOptions.target);
            }
            if (filename === "lib.d.ts") {
                return ts.createSourceFile(filename, libSource, compilerOptions.target);
            }
            return null;
        },
        writeFile: function (name, text, writeByteOrderMark) {
            if (name.slice(name.length - 4) === ".map") {
                name = name.slice(0, name.length - 7);
                var sourceMap = JSON.parse(text);
                sourceMap.sourcesContent = [sourceFiles[(name + ".ts")]];
                sourceMaps[name] = sourceMap;
            }
            else {
                var filePath = name.slice(0, name.length - 3);
                var fileName = filePath.slice(filePath.lastIndexOf("/") + 1);
                var sourceMapText = "//# sourceMappingURL=" + fileName + ".js.map";
                var sourceMapEmpty = new Array(sourceMapText.length).join(" ");
                text = text.replace(sourceMapText, sourceMapEmpty);
                files.push({ name: filePath, text: text });
                script += "\n" + text;
            }
        },
        getDefaultLibFileName: function () { return "lib.d.ts"; },
        useCaseSensitiveFileNames: function () { return false; },
        getCanonicalFileName: function (filename) { return filename; },
        getCurrentDirectory: function () { return ""; },
        getNewLine: function () { return "\n"; }
    };
    // Create a program from inputs
    var program = ts.createProgram(sourceFileNames, compilerOptions, compilerHost);
    // Query for earyly errors
    var errors = ts.getPreEmitDiagnostics(program);
    var typeChecker;
    // Do not generate code in the presence of early errors
    if (errors.length === 0) {
        // Type check and get semantic errors
        typeChecker = program.getTypeChecker();
        // Generate output
        errors = program.emit().diagnostics;
    }
    return {
        errors: errors.map(function (e) {
            return {
                file: e.file.fileName,
                position: e.file.getLineAndCharacterOfPosition(e.start),
                length: e.length,
                message: e.messageText
            };
        }),
        program: program, typeChecker: typeChecker, script: script, sourceMaps: sourceMaps, files: files
    };
}
exports.default = compileTypeScript;
