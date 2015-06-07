var fs = require("fs");
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
        title.textContent = "Default editor settings";
        container.appendChild(title);
        var tbody = (SupClient.table.createTable(container)).tbody;
        // let tbody = SupClient.table.createTable(container).tbody;
        this.themeRow = SupClient.table.appendRow(tbody, "Theme");
        // this.fields["theme"] = SupClient.table.appendSelectBox(this.themeRow.valueCell, "monokai");
        // get list of all available themes then enable HTML5 autocompletion
        fs.readdir("public/editors/ftext/codemirror-themes", function (err, files) {
            if (files != null && files.length > 0) {
                var options = {};
                for (var i in files) {
                    var file = files[i].replace(".css", "");
                    options[file] = file;
                }
                _this.fields["theme"] = SupClient.table.appendSelectBox(_this.themeRow.valueCell, options, "default");
                _this.fields["theme"].addEventListener("change", function (event) {
                    var theme = (event.target.value !== "") ? event.target.value : "default";
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                        alert(err); });
                    // call onResourceEdited methods that have subscribed to resources via project client
                });
            }
        });
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;
