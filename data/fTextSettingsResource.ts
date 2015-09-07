export default class fTextSettingsResource extends SupCore.data.base.Resource {
  static schema = {
    theme: { type: "string", mutable: true },
    customTheme: { type: "string", mutable: true },
    tabSize: { type: "number", min: 1, max: 8, mutable: true },
    indentWithTabs: { type: "boolean", mutable: true },
    keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
    styleActiveLine: { type: "boolean", mutable: true },
    showTrailingSpace: { type: "boolean", mutable: true },
    autoCloseBrackets: { type: "boolean", mutable: true },
    matchTags: { type: "boolean", mutable: true },
    highlightSelectionMatches: { type: "boolean", mutable: true },
    lint_json: { type: "boolean", mutable: true },
    lint_cson: { type: "boolean", mutable: true },
    lint_javascript: { type: "boolean", mutable: true },
    lint_jade: { type: "boolean", mutable: true },
    lint_stylus: { type: "boolean", mutable: true },
    lint_css: { type: "boolean", mutable: true },
    lint_yaml: { type: "boolean", mutable: true },
  };

  static defaultValues: any = {
    theme: "default",
    customTheme: "",
    tabSize: 2,
    indentWithTabs: true,
    keyMap: "sublime",
    styleActiveLine: true,
    autoCloseBrackets: true,
    showTrailingSpace: true,
    matchTags: true,
    highlightSelectionMatches: true,
    lint_json: true,
    lint_cson: true,
    lint_javascript: true,
    lint_jade: true,
    lint_stylus: true,
    lint_css: true,
    lint_yaml: true,
  }; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...

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
