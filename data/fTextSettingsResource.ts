export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    theme: { type: "string", mutable: true },
    customThemes: { type: "string", mutable: true },
    indentUnit: { type: "number", min: 1, max: 8, mutable: true },
    keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
    styleActiveLine: { type: "boolean", mutable: true },
    showTrailingSpace: { type: "boolean", mutable: true },
    autoCloseBrackets: { type: "boolean", mutable: true },
    matchTags: { type: "boolean", mutable: true },
    highlightSelectionMatches: { type: "boolean", mutable: true },
  }

  static defaultValues: { [key: string]: any } = { 
    theme: "default",
    customThemes: "",
    indentUnit: 2,
    keyMap: "sublime",
    styleActiveLine: true,
    autoCloseBrackets: true,
    showTrailingSpace: false,
    matchTags: true,
    highlightSelectionMatches: true,
  }

  constructor(pub: any, serverData?: any) {
    super(pub, fTextSettingsResource.schema, serverData);
  }

  init(callback: Function) {
    let pub: { [key: string]: any } = {};
    for (let name in fTextSettingsResource.defaultValues) {
      pub[name] = fTextSettingsResource.defaultValues[name];
    }
    this.pub = pub
    super.init(callback);
  }
}
