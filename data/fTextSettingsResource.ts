export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    editorSettings: { type: "hash", mutable: true },
    // theme: { type: "string?", mutable: true },
    // framesPerSecond: { type: "integer", mutable: true },
    // ratioNumerator: { type: "integer?", mutable: true },
    // ratioDenominator: { type: "integer?", mutable: true }
  }

  constructor(pub: any, serverData?: any) {
    super(pub, fTextSettingsResource.schema, serverData);
  }

  init(callback: Function) {
    // default values
    this.pub = { 
      // theme: "monokai",
      editorSettings: {
        theme: "monokai"
      },
      // framesPerSecond: 60,
      // ratioNumerator: null,
      // ratioDenominator: null
    };
    super.init(callback);
  }
}
