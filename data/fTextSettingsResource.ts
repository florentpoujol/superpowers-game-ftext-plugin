export default class FTextSettingsResource extends SupCore.Data.Base.Resource {
  static schema: SupCore.Data.Schema = {
    styleActiveLine: { type: "boolean", mutable: true },
    showTrailingSpace: { type: "boolean", mutable: true },
    autoCloseBrackets: { type: "boolean", mutable: true },
    matchTags: { type: "boolean", mutable: true },
    highlightSelectionMatches: { type: "boolean", mutable: true },
    lint: { type: "boolean", mutable: true }
  };

  static defaultValues: any = {
    styleActiveLine: true,
    autoCloseBrackets: true,
    showTrailingSpace: true,
    matchTags: true,
    highlightSelectionMatches: true,
    lint: true,
  }; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...

  constructor(id: string, pub: any, serverData?: any) {
    super(id, pub, FTextSettingsResource.schema, serverData);
  }

  init(callback: Function): void {
    let pub: { [key: string]: any } = {};
    for (let name in FTextSettingsResource.defaultValues) {
      pub[name] = FTextSettingsResource.defaultValues[name];
    }
    this.pub = pub;
    super.init(callback);
  }
}
