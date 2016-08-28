"use strict";
var fTextSettingsResource_1 = require("../data/fTextSettingsResource");
var fs = require("fs");
var domify = require("domify");
var FTextSettingsEditor = (function () {
    function FTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.booleanFields = [];
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (_this.booleanFields.indexOf(setting) !== -1)
                    _this.fields[setting].checked = resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
            }
        };
        this.onResourceEdited = function (resourceId, command, setting) {
            if (_this.booleanFields.indexOf(setting) !== -1)
                _this.fields[setting].checked = _this.resource.pub[setting];
            else
                console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, _this.resource.pub[setting]);
        };
        this.projectClient = projectClient;
        // build the form from the html file
        var html = fs.readFileSync("settingsEditors/fTextSettingsEditor.html", { encoding: "utf8" });
        container.appendChild(domify(html));
        // ----------------------------------------
        // build booleand settings
        for (var setting in fTextSettingsResource_1.default.defaultValues) {
            var defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", function (event) {
                    _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, function (err) {
                        if (err != null) {
                            console.error(err);
                            new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close"));
                        }
                    });
                });
            }
        }
        this.projectClient.subResource("fTextSettings", this);
    }
    return FTextSettingsEditor;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FTextSettingsEditor;
