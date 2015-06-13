var fTextSettingsResource_1 = require("../data/fTextSettingsResource");
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
        this.booleanFields = [];
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
        this.fields["theme"] = document.querySelector("#theme");
        // get list of all available themes
        fs.readdir("public/editors/ftext/codemirror-themes", function (err, themes) {
            if (err)
                throw err;
            if (themes != null && themes.length > 0) {
                for (var i in themes) {
                    var file = themes[i].replace(".css", "");
                    var option = document.createElement("option");
                    option.value = file;
                    option.textContent = file;
                    _this.fields["theme"].appendChild(option);
                }
                _this.fields["theme"].addEventListener("change", function (event) {
                    var theme = (event.target.value !== "") ? event.target.value : "default";
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                        alert(err); });
                });
            }
        });
        this.fields["indentUnit"] = document.querySelector("#indentUnit");
        this.fields["indentUnit"].addEventListener("change", function (event) {
            var size = (event.target.value !== "") ? event.target.value : 2;
            // call onResourceEdited methods that have subscribed to resources via project client
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "indentUnit", parseInt(size), function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["keyMap"] = document.querySelector("#keyMap");
        this.fields["keyMap"].addEventListener("change", function (event) {
            var map = (event.target.value !== "") ? event.target.value : "sublime";
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "keyMap", map, function (err) { if (err != null)
                console.error(err); });
        });
        // ----------------------------------------
        // build booleand settings
        for (var setting in fTextSettingsResource_1.default.defaultValues) {
            var defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", function (event) {
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, function (err) { if (err != null)
                        console.error(err); });
                });
            }
        }
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;
