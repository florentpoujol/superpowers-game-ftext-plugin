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
  booleanFields: string[];

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    // build the form from the html file
    let html = fs.readFileSync("public/fTextSettingsEditor.html", {encoding: "utf8"});
    container.appendChild(domify.parse(html));

    // register fields
    this.fields["theme"] = <HTMLSelectElement>document.querySelector("#theme-select");
    // get list of all available themes
    fs.readdir("public/editors/ftext/codemirror-themes", (err: Error, themes?: any) => {
      if (err) throw err;

      if (themes != null && themes.length > 0) {
        let themeSelect = this.fields["theme"];
        for (let i in themes) {
          let file = themes[i].replace(".css", "");
          let option = document.createElement("option");
          option.value = file;
          option.textContent = file;
          if (this.resource != null && this.resource.pub.theme === file) {
            //option.selected = true;
          }
          themeSelect.appendChild(option);
        }

        themeSelect.addEventListener("change", (event: any) => {
          let theme = (event.target.value !== "") ? event.target.value : "default";
          this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, (err?: string) => { if (err != null) alert(err); } );
        });
      }
    });

    this.fields["indentUnit"] = <HTMLInputElement>document.querySelector("#indentUnit-input");
    this.fields["indentUnit"].addEventListener("change", (event: any) => {
      let size = (event.target.value !== "") ? event.target.value : 2;
      // call onResourceEdited methods that have subscribed to resources via project client
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "indentUnit", parseInt(size), (err?: string) => { if (err != null) console.error(err); } );
    });

    this.fields["keyMap"] = <HTMLSelectElement>document.querySelector("#keyMap-select");
    this.fields["keyMap"].addEventListener("change", (event: any) => {
      let map = (event.target.value !== "") ? event.target.value : "sublime";
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "keyMap", map, (err?: string) => { if (err != null) console.error(err); } );
    });

    this.booleanFields = ["styleActiveLine", "showTrailingSpace", "autoCloseBrackets"];
    
    this.fields["styleActiveLine"] = <HTMLInputElement>document.querySelector("#styleActiveLine");
    this.fields["styleActiveLine"].addEventListener("click", (event: any) => {
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "styleActiveLine", event.target.checked, (err?: string) => { if (err != null) console.error(err); } );
    });

    this.fields["showTrailingSpace"] = <HTMLInputElement>document.querySelector("#showTrailingSpace");
    this.fields["showTrailingSpace"].addEventListener("click", (event: any) => {
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "showTrailingSpace", event.target.checked, (err?: string) => { if (err != null) console.error(err); } );
    });

    this.fields["autoCloseBrackets"] = <HTMLInputElement>document.querySelector("#autoCloseBrackets");
    this.fields["autoCloseBrackets"].addEventListener("click", (event: any) => {
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "autoCloseBrackets", event.target.checked, (err?: string) => { if (err != null) console.error(err); } );
    });

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
