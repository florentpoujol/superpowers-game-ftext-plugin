var createLanguageService_1 = require("../../data/createLanguageService");
var fuzzy = require("fuzzy");
onmessage = function (event) {
    var service = createLanguageService_1.default(event.data.scriptNames, event.data.scripts, event.data.globalDefs);
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
                list.push(result.original);
            }
        }
    }
    postMessage(list);
};
