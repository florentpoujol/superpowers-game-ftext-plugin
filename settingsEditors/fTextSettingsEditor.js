var fs = require("fs");
var domify = require("domify");
// definitions are index.d.ts
// IMPORTANT: domify has been modified so that the module expose an object that contains the parse function
// instead of exposing the function directly.
// Typescript would let met import the module and use it as a function at the same time.
var fTextSettingsEditor = (function () {
    function fTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            _this.fields[propertyName].value = _this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        var title = document.createElement("h2");
        title.textContent = "Editor settings";
        container.appendChild(title);
        fs.readFile("public/fTextSettingsEditor.html", { encoding: "utf8" }, function (err, text) {
            if (err)
                throw err;
            container.appendChild(domify.parse(text));
            // get list of all available themes then enable HTML5 autocompletion
            var themesCallback = function (err, files) {
                if (err)
                    throw err;
                if (files != null && files.length > 0) {
                    var themeSelect = document.querySelector("#theme-select");
                    for (var i in files) {
                        var file = files[i].replace(".css", "");
                        var option = document.createElement("option");
                        option.value = file;
                        option.textContent = file;
                        themeSelect.appendChild(option);
                    }
                    themeSelect.addEventListener("change", function (event) {
                        var theme = (event.target.value !== "") ? event.target.value : "default";
                        // call onResourceEdited methods that have subscribed to resources via project client
                        _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                            alert(err); });
                    });
                }
            };
            // for some reason, gulp would give me an "Unexpected token" error if I define the callback inside the readdir parameters
            fs.readdir("public/editors/ftext/codemirror-themes", themesCallback);
            _this.projectClient.subResource("fTextSettings", _this);
        });
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;
