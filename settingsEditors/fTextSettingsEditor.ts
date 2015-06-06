import fTextSettingsResource from "../data/fTextSettingsResource";
import * as fs from "fs";

export default class fTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: fTextSettingsResource;

  // editorSettings: { [key: string]: any } = {};
  // editorSettingsRow: SupClient.table.RowParts;
  themeRow: SupClient.table.RowParts;

  fields: { [name: string]: HTMLInputElement } = {};

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    let title = document.createElement("h2");
    title.textContent = "Default editor settings";
    container.appendChild( title );


    let { tbody } = SupClient.table.createTable(container);
    // let tbody = SupClient.table.createTable(container).tbody;

    this.themeRow = SupClient.table.appendRow(tbody, "Theme");
    this.fields["theme"] = SupClient.table.appendTextField(this.themeRow.valueCell, "monokai");

    // get list of all available themes then enable HTML5 autocompletion
    fs.readdir("public/editors/ftext/codemirror-themes", (err: Error, files?: any) => {
      if (files != null && files.length > 0) {
        this.fields["theme"].setAttribute("list", "themes-list"); // this.fields["theme"].list =   would throw an error

        let datalist = document.createElement("datalist");
        datalist.id = "themes-list";
        this.themeRow.valueCell.appendChild(datalist);

        for (let theme of files) {
          let option = document.createElement("option");
          option.value = theme.replace(".css", "");
          datalist.appendChild(option);
        }
      }
    });

    this.fields["theme"].addEventListener("change", (event: any) => {
      let theme = (event.target.value !== "") ? event.target.value : null;
      this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, (err: string) => { if (err != null) alert(err); });
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
