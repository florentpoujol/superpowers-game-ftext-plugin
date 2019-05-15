"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fTextSettingsResource_1 = require("../data/fTextSettingsResource");
const fs = require("fs");
const domify = require("domify");
class FTextSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.booleanFields = [];
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            for (let setting in resource.pub) {
                if (this.booleanFields.indexOf(setting) !== -1)
                    this.fields[setting].checked = resource.pub[setting];
                else
                    console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
            }
        };
        this.onResourceEdited = (resourceId, command, setting) => {
            if (this.booleanFields.indexOf(setting) !== -1)
                this.fields[setting].checked = this.resource.pub[setting];
            else
                console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, this.resource.pub[setting]);
        };
        this.projectClient = projectClient;
        // build the form from the html file
        let html = fs.readFileSync("settingsEditors/fTextSettingsEditor.html", { encoding: "utf8" });
        container.appendChild(domify(html));
        // ----------------------------------------
        // build booleand settings
        for (let setting in fTextSettingsResource_1.default.defaultValues) {
            let defaultValue = fTextSettingsResource_1.default.defaultValues[setting];
            if (typeof defaultValue === "boolean") {
                this.booleanFields.push(setting);
                this.fields[setting] = document.querySelector("#" + setting);
                this.fields[setting].checked = defaultValue;
                this.fields[setting].addEventListener("click", (event) => {
                    this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, (err) => {
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
}
exports.default = FTextSettingsEditor;
