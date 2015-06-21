import fTextSettingsResource from "../data/fTextSettingsResource";
import * as fs from "fs";

import * as domify from "domify";
// definitions are index.d.ts
// IMPORTANT: domify has been modified so that the module expose an object that contains the parse function
// instead of exposing the function directly.
// Typescript wouldn't let met import the module and use it as a function at the same time.

export default class fTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: fTextSettingsResource;
  fields: { [name: string]: HTMLInputElement|HTMLSelectElement } = {};
  booleanFields: string[] = [];

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    // build the form from the html file
    let html = fs.readFileSync("settingsEditors/fTextSettingsEditor.html", {encoding: "utf8"});
    container.appendChild((<any>domify)(html));
    // container.appendChild(domify.parse(html));

    // register fields
    this.fields["theme"] = <HTMLSelectElement>document.querySelector("#theme");
    // get list of all available themes
    fs.readdir("public/editors/ftext/codemirror-themes", (err: Error, themes?: any) => {
      if (err) throw err;

      if (themes != null && themes.length > 0) {
        for (let i in themes) {
          let file = themes[i].replace(".css", "");
          let option = document.createElement("option");
          option.value = file;
          option.textContent = file;
          this.fields["theme"].appendChild(option);
        }

        this.fields["theme"].addEventListener("change", (event: any) => {
          let theme = (event.target.value !== "") ? event.target.value : "default";
          this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, (err?: string) => { if (err != null) alert(err); } );
        });
      }
    });

    this.fields["indentUnit"] = <HTMLInputElement>document.querySelector("#indentUnit");
    this.fields["indentUnit"].addEventListener("change", (event: any) => {
      let size = (event.target.value !== "") ? event.target.value : 2;
      // call onResourceEdited methods that have subscribed to resources via project client
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "indentUnit", parseInt(size), (err?: string) => { if (err != null) console.error(err); } );
    });

    this.fields["keyMap"] = <HTMLSelectElement>document.querySelector("#keyMap");
    this.fields["keyMap"].addEventListener("change", (event: any) => {
      let map = (event.target.value !== "") ? event.target.value : "sublime";
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "keyMap", map, (err?: string) => { if (err != null) console.error(err); } );
    });

    // ----------------------------------------
    // build booleand settings

    for (let setting in fTextSettingsResource.defaultValues) {
      let defaultValue = fTextSettingsResource.defaultValues[setting];
      if (typeof defaultValue === "boolean") {
        this.booleanFields.push(setting);

        this.fields[setting] = <HTMLInputElement>document.querySelector("#"+setting);
        (<HTMLInputElement>this.fields[setting]).checked = defaultValue;

        this.fields[setting].addEventListener("click", (event: any) => {
          this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", event.target.id, event.target.checked, (err?: string) => { if (err != null) console.error(err); } );
        });
      }
    }

    this.projectClient.subResource("fTextSettings", this);
  }

  onResourceReceived = (resourceId: string, resource: fTextSettingsResource) => {
    this.resource = resource;
    for (let setting in resource.pub) {
      if (this.booleanFields.indexOf(setting) !== -1)
        (<HTMLInputElement>this.fields[setting]).checked = resource.pub[setting];
      else {
        if (this.fields[setting] != null)
          this.fields[setting].value = resource.pub[setting];
        else
          console.error("fTextSettingsEditor.onResourceReceived(): unknow setting", setting, resource.pub[setting]);
      }
    }
  }

  onResourceEdited = (resourceId: string, command: string, setting: string) => {
    if (this.booleanFields.indexOf(setting) !== -1)
      (<HTMLInputElement>this.fields[setting]).checked = this.resource.pub[setting];
    else {
      if (this.fields[setting] != null)
        this.fields[setting].value = this.resource.pub[setting];
      else
        console.error("fTextSettingsEditor.onResourceEdited(): unknow setting", setting, this.resource.pub[setting]);
    }

  }
}
