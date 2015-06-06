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
        this.fields["theme"] = SupClient.table.appendTextField(this.themeRow.valueCell, "monokai");
        // get list of all available themes then enable HTML5 autocompletion
        fs.readdir("public/editors/ftext/codemirror-themes", function (err, files) {
            if (files != null && files.length > 0) {
                _this.fields["theme"].setAttribute("list", "themes-list"); // this.fields["theme"].list =   would throw an error
                var datalist = document.createElement("datalist");
                datalist.id = "themes-list";
                _this.themeRow.valueCell.appendChild(datalist);
                for (var _i = 0; _i < files.length; _i++) {
                    var theme = files[_i];
                    var option = document.createElement("option");
                    option.value = theme.replace(".css", "");
                    datalist.appendChild(option);
                }
            }
        });
        this.fields["theme"].addEventListener("change", function (event) {
            var theme = (event.target.value !== "") ? event.target.value : null;
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;
