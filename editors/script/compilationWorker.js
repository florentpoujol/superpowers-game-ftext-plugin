var ts = require("typescript");
var createLanguageService_1 = require("../../data/createLanguageService");
onmessage = function (event) {
    var service = createLanguageService_1.default(event.data.scriptNames, event.data.scripts, event.data.globalDefs);
    var errors;
    try {
        errors = ts.getPreEmitDiagnostics(service.getProgram());
    }
    catch (e) {
        postMessage([{ file: "", position: { line: 0, character: 1 }, length: 0, message: e.message }]);
        return;
    }
    var formatedErrors = errors.map(function (e) {
        return {
            file: e.file.fileName,
            position: e.file.getLineAndCharacterOfPosition(e.start),
            length: e.length,
            message: e.messageText
        };
    });
    postMessage(formatedErrors);
};
