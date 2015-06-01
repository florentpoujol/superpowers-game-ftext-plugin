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
        var tbody = SupClient.table.createTable(container).tbody;
        // let { tbody } = SupClient.table.createTable(container);
        this.themeRow = SupClient.table.appendRow(tbody, "Theme");
        this.fields["theme"] = SupClient.table.appendTextField(this.themeRow.valueCell, "monokai default");
        // TODO: get list of all available themes (how ? should be able to read the public folder) then enable HTML5 autocompletion
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
