export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    theme: { type: "string?", mutable: true },
  }

  constructor(pub: any, serverData?: any) {
    super(pub, fTextSettingsResource.schema, serverData);
  }

  init(callback: Function) {
    // default values
    this.pub = { 
      theme: "monokai"
    };
    super.init(callback);
  }
}
