var fTextSettingsResource_1 = require("../data/fTextSettingsResource");
var fs = require("fs");
var domify = require("domify");
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
        var html = fs.readFileSync("settingsEditors/fTextSettingsEditor.html", { encoding: "utf8" });
        container.appendChild(domify(html));
        // register fields
        this.fields["theme"] = document.querySelector("#theme");
        // get list of all available themes
        // note: the list is "cached" by the browserification
        fs.readdir("public/editors/ftext/codemirror-themes", function (err, themes) {
            if (err)
                throw err;
            if (themes != null && themes.length > 0) {
                for (var i in themes)
                    _this.addThemeToSelect(themes[i]);
                _this.fields["theme"].addEventListener("change", function (event) {
                    var theme = (event.target.value !== "") ? event.target.value : "default";
                    // call onResourceEdited methods that have subscribed to resources via project client
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                        alert(err); });
                });
            }
        });
        this.fields["customTheme"] = document.querySelector("#customTheme");
        this.fields["customTheme"].addEventListener("change", function (event) {
            var theme = (event.target.value !== "") ? event.target.value.trim() : "";
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "customTheme", theme, function (err) { if (err != null)
                console.error(err); });
        });
        this.fields["tabSize"] = document.querySelector("#tabSize");
        this.fields["tabSize"].addEventListener("change", function (event) {
            var size = (event.target.value !== "") ? event.target.value : 2;
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "tabSize", parseInt(size), function (err) { if (err != null)
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
    // called from the constructor with the default themes
    // then from onResourceReceived() with the custom themes
    fTextSettingsEditor.prototype.addThemeToSelect = function (theme) {
        var file = theme.replace(".css", "");
        var option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        this.fields["theme"].appendChild(option);
    };
    return fTextSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fTextSettingsEditor;
