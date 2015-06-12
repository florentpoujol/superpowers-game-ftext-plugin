var fs = require("fs");
var domify = require("domify");
// definitions are index.d.ts
// IMPORTANT: domify has been modified so that the module expose an object that contains the parse function
// instead of exposing the function directly.
// Typescript wouldn't let met import the module and use it as a function at the same time.
var fTextSettingsEditor = (function () {
    function fTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (_this.booleanFields.indexOf(setting) !== -1)
                    _this.fields[setting].checked = resource.pub[setting];
                else {
                    if (_this.fields[setting] != null)
                        _this.fields[setting].value = resource.pub[setting];
                    else
                        console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
                }
            }
        };
        this.onResourceEdited = function (resourceId, command, setting) {
            if (_this.booleanFields.indexOf(setting) !== -1)
                _this.fields[setting].checked = _this.resource.pub[setting];
            else {
                if (_this.fields[setting] != null)
                    _this.fields[setting].value = _this.resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, _this.resource.pub[setting]);
            }
        };
        this.projectClient = projectClient;
        // build the form from the html file
        var html = fs.readFileSync("public/fTextSettingsEditor.html", { encoding: "utf8" });
        container.appendChild(domify.parse(html));
        // register fields
        this.fields["theme"] = document.querySelector("#theme-select");
        // get list of all available themes
        fs.readdir("public/editors/ftext/codemirror-themes", function (err, themes) {
            if (err)
                throw err;
            if (themes != null && themes.length > 0) {
                var themeSelect = _this.fields["theme"];
                for (var i in themes) {
                    var file = themes[i].replace(".css", "");
                    var option = document.createElement("option");
                    option.value = file;
                    option.textContent = file;
                    if (_this.resource != null && _this.resource.pub.theme === file) {
                    }
                    themeSelect.appendChild(option);
                }
                themeSelect.addEventListener("change", function (event) {
                    var theme = (event.target.value !== "") ? event.target.value : "default";
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                        alert(err); });
                });
            }
        });
        this.fields["indentUnit"] = document.querySelector("#indentUnit-input");
        this.fields["indentUnit"].addEventListener("change", function (event) {
            var size = (event.target.value !== "") ? event.target.value : 2;
            // call onResourceEdited methods that have subscribed to resources via project client
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "indentUnit", parseInt(size), function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["keyMap"] = document.querySelector("#keyMap-select");
        this.fields["keyMap"].addEventListener("change", function (event) {
            var map = (event.target.value !== "") ? event.target.value : "sublime";
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "keyMap", map, function (err) { if (err != null)
                console.error(err); });
        });
        this.booleanFields = ["styleActiveLine", "showTrailingSpace", "autoCloseBrackets"];
        this.fields["styleActiveLine"] = document.querySelector("#styleActiveLine");
        this.fields["styleActiveLine"].addEventListener("click", function (event) {
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "styleActiveLine", event.target.checked, function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["showTrailingSpace"] = document.querySelector("#showTrailingSpace");
        this.fields["showTrailingSpace"].addEventListener("click", function (event) {
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "showTrailingSpace", event.target.checked, function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["autoCloseBrackets"] = document.querySelector("#autoCloseBrackets");
        this.fields["autoCloseBrackets"].addEventListener("click", function (event) {
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "autoCloseBrackets", event.target.checked, function (err) { if (err != null)
                console.error(err); });
        });
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;
