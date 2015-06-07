import fTextSettingsResource from "../data/fTextSettingsResource";
import * as fs from "fs";

export default class fTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: fTextSettingsResource;

  // editorSettings: { [key: string]: any } = {};
  // editorSettingsRow: SupClient.table.RowParts;
  themeRow: SupClient.table.RowParts;

  fields: { [name: string]: HTMLInputElement|HTMLSelectElement } = {};

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    let title = document.createElement("h2");
    title.textContent = "Default editor settings";
    container.appendChild( title );


    let { tbody } = SupClient.table.createTable(container);
    // let tbody = SupClient.table.createTable(container).tbody;

    this.themeRow = SupClient.table.appendRow(tbody, "Theme");
    // this.fields["theme"] = SupClient.table.appendSelectBox(this.themeRow.valueCell, "monokai");

    // get list of all available themes then enable HTML5 autocompletion
    fs.readdir("public/editors/ftext/codemirror-themes", (err: Error, files?: any) => {
      if (files != null && files.length > 0) {
        
        let options: any = {};
        for (let i in files) {
          let file = files[i].replace(".css", "");
          options[file] = file;
        }
        this.fields["theme"] = SupClient.table.appendSelectBox(this.themeRow.valueCell, options, "default");

        this.fields["theme"].addEventListener("change", (event: any) => {
          let theme = (event.target.value !== "") ? event.target.value : "default";

          this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, (err: string) => { if (err != null) alert(err); });
          // call onResourceEdited methods that have subscribed to resources via project client
        });

      }
    });

    

    this.projectClient.subResource("fTextSettings", this);
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
