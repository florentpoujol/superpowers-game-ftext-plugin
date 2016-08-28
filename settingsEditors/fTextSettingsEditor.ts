import FTextSettingsResource from "../data/fTextSettingsResource";
import * as fs from "fs";
import * as domify from "domify";

export default class FTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: FTextSettingsResource;
  fields: { [name: string]: HTMLInputElement } = {};
  booleanFields: string[] = [];

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    // build the form from the html file
    let html = fs.readFileSync("settingsEditors/fTextSettingsEditor.html", {encoding: "utf8"});
    container.appendChild((domify as any)(html));

    // ----------------------------------------
    // build booleand settings

    for (let setting in FTextSettingsResource.defaultValues) {
      let defaultValue = FTextSettingsResource.defaultValues[setting];
      if (typeof defaultValue === "boolean") {
        this.booleanFields.push(setting);

        this.fields[setting] = (document.querySelector("#" + setting) as HTMLInputElement);
        this.fields[setting].checked = defaultValue;

        this.fields[setting].addEventListener("click", (event: any) => {
          this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, (err?: string) => {
            if (err != null) {
              console.error(err);
              new SupClient.Dialogs.InfoDialog(err, SupClient.i18n.t("common:actions.close"));
            }
          } );
        });
      }
    }

    this.projectClient.subResource("fTextSettings", this);
  }

  onResourceReceived = (resourceId: string, resource: FTextSettingsResource) => {
    this.resource = resource;
    for (let setting in resource.pub) {
      if (this.booleanFields.indexOf(setting) !== -1)
        this.fields[setting].checked = resource.pub[setting];
      else
        console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
    }
  }

  onResourceEdited = (resourceId: string, command: string, setting: string) => {
    if (this.booleanFields.indexOf(setting) !== -1)
      this.fields[setting].checked = this.resource.pub[setting];
    else
      console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, this.resource.pub[setting]);
  }
}
