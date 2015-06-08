import fTextSettingsResource from "../data/fTextSettingsResource";
import * as fs from "fs";

import * as domify from "domify";
// definitions are index.d.ts
// IMPORTANT: domify has been modified so that the module expose an object that contains the parse function
// instead of exposing the function directly.
// Typescript would let met import the module and use it as a function at the same time.

export default class fTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: fTextSettingsResource;

  fields: { [name: string]: HTMLInputElement|HTMLSelectElement } = {};

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    let title = document.createElement("h2");
    title.textContent = "Editor settings";
    container.appendChild( title );

    

    fs.readFile("public/fTextSettingsEditor.html", {encoding: "utf8"}, (err: Error, text: string) => {
      if (err) throw err;

      container.appendChild(domify.parse(text));

      // get list of all available themes then enable HTML5 autocompletion
      let themesCallback = (err: Error, files?: any) => {
        if (err) throw err;
        if (files != null && files.length > 0) {
          let themeSelect = document.querySelector("#theme-select");
          for (let i in files) {
            let file = files[i].replace(".css", "");
            let option = document.createElement("option");
            option.value = file;
            option.textContent = file;
            themeSelect.appendChild(option);
          }

          themeSelect.addEventListener("change", (event: any) => {
            let theme = (event.target.value !== "") ? event.target.value : "default";
            // call onResourceEdited methods that have subscribed to resources via project client
            this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, (err?: string) => { if (err != null) alert(err); } );
          });
        }
      };
      // for some reason, gulp would give me an "Unexpected token" error if I define the callback inside the readdir parameters
      fs.readdir("public/editors/ftext/codemirror-themes", themesCallback);
      
      this.projectClient.subResource("fTextSettings", this);
    });
  }

  onResourceReceived = (resourceId: string, resource: fTextSettingsResource) => {
    this.resource = resource;
    for (let setting in resource.pub) {
      this.fields[setting].value = resource.pub[setting];
    }
  }

  onResourceEdited = (resourceId: string, command: string, propertyName: string) => {
    this.fields[propertyName].value = this.resource.pub[propertyName];
  }
}
