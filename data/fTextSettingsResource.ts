export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    theme: { type: "string", mutable: true },
    tabSize: { type: "number", min: 1, max: 8, mutable: true },
    keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
  }

  constructor(pub: any, serverData?: any) {
    super(pub, fTextSettingsResource.schema, serverData);
  }

  init(callback: Function) {
    // default values
    this.pub = { 
      theme: "default",
      tabSize: 2,
      keyMap: "sublime"
    };
    super.init(callback);
  }
}
