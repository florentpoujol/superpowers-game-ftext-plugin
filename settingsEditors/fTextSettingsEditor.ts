import fTextSettingsResource from "../data/fTextSettingsResource";

export default class fTextSettingsEditor {

  projectClient: SupClient.ProjectClient;
  resource: fTextSettingsResource;

  // editorSettings: { [key: string]: any } = {};
  // editorSettingsRow: SupClient.table.RowParts;
  themeRow: SupClient.table.RowParts;

  fields: { [name: string]: HTMLInputElement } = {};

  constructor(container: HTMLDivElement, projectClient: SupClient.ProjectClient) {
    this.projectClient = projectClient;

    let tbody = SupClient.table.createTable(container).tbody;
    // let { tbody } = SupClient.table.createTable(container);

    this.themeRow = SupClient.table.appendRow(tbody, "Theme");
    this.fields["theme"] = SupClient.table.appendTextField(this.themeRow.valueCell, "monokai default");
    // TODO: get list of all available themes (how ? should be able to read the public folder) then enable HTML5 autocompletion

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
