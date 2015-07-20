export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    theme: { type: "string", mutable: true },
    customThemes: { type: "string", mutable: true },
    tabSize: { type: "number", min: 1, max: 8, mutable: true },
    indentWithTabs: { type: "boolean", mutable: true },
    keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
    styleActiveLine: { type: "boolean", mutable: true },
    showTrailingSpace: { type: "boolean", mutable: true },
    autoCloseBrackets: { type: "boolean", mutable: true },
    matchTags: { type: "boolean", mutable: true },
    highlightSelectionMatches: { type: "boolean", mutable: true },
    lint: { 
      type: "hash",
      keys: { minLength: 1 },
      values: {
        type: "hash",
        json: { type: "boolean", mutable: true },
        cson: { type: "boolean", mutable: true },
        javascript: { type: "boolean", mutable: true },
        jade: { type: "boolean", mutable: true },
        stylus: { type: "boolean", mutable: true },
        css: { type: "boolean", mutable: true },
      }
    }
  }

  static defaultValues: any = { 
    theme: "default",
    customThemes: "",
    tabSize: 2,
    indentWithTabs: true,
    keyMap: "sublime",
    styleActiveLine: true,
    autoCloseBrackets: true,
    showTrailingSpace: true,
    matchTags: true,
    highlightSelectionMatches: true,
    lint: {
      json: true,
      cson: true,
      javascript: true,
      jade: true,
      stylus: true,
      css: true
    }
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
