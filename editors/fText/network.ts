import * as querystring from "querystring";
import ui from "./ui";
import FTextAsset from "../../data/fTextAsset";
import FTextSettingsResource from "../../data/fTextSettingsResource";

export const data: {
  projectClient?: SupClient.ProjectClient;
  asset?: FTextAsset;
  assetInstructions?: { [key: string]: any };
  assetSyntax?: string; // set in assetSubscriber.onAsetReceived()
  FTextSettingsResourcePub?: any; // set in onResourceReceived(), used in onfTextSettingsUpdated()
} = {};

export let socket: SocketIOClient.Socket;
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "fTextEditor" }], () => {
  socket = SupClient.connect(SupClient.query.project);
  socket.on("welcome", onWelcomed);
  socket.on("disconnect", SupClient.onDisconnected);
});

// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()

// used in assetSubscriber.onAssetReceive() when subscribing to the resource
let resourceSubscriber: any = {
  onResourceReceived: (resourceId: string, resource: FTextSettingsResource) => {
    data.FTextSettingsResourcePub = resource.pub;
    onFTextSettingsResourceUpdated();
  },

  onResourceEdited: (resourceId: string, command: string, propertyName: string) => {
    onFTextSettingsResourceUpdated();
  }
};

// updates the editor (when open) when the resource is received or edited
// called from the resources handlers
function onFTextSettingsResourceUpdated() {
  if (ui.editor != null) {
    const pub = data.FTextSettingsResourcePub;
    const defaultValues = FTextSettingsResource.defaultValues;
    // const syntax: string = data.assetSyntax;

    for (let optionName in defaultValues) {
      let optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
      // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl optionValue is always chosen.

      if (optionValue !== ui.editor.codeMirrorInstance.getOption(optionName)) {
        if (optionName === "lint") {
          optionValue = false; // quick fix while linting feature are being reimplemented
          allowLinting(optionValue);
          // allowLinting(optionValue);
        }

        ui.editor.codeMirrorInstance.setOption(optionName, optionValue);
      }
    }
  }
}

// used in assetSubscriber.onAssetReceived() and onFTextSettingsResourceUpdated()
function allowLinting(allow: boolean = true) {
  // ui.isAssetLinted = false; // quick fix while linting feature are being reimplemented
  ui.isAssetLinted = allow;
  if (allow === false)
    ui.refreshErrors([]);
}

// ----------------------------------------

// used in assetSubscriber.onAssetEdited()
const onAssetCommands: any = {
  editText: (operationData: OperationData) => {
    ui.hasDraft(true);
    ui.editor.receiveEditText(operationData);
  },

  applyDraftChanges: () => {
    ui.hasDraft(false);
  }
};

// ----------------------------------------

const assetSubscriber: SupClient.AssetSubscriber = {
  onAssetReceived: (id: string, asset: FTextAsset) => {
    if (id !== SupClient.query.asset) return;

    data.asset = asset;

    ui.hasDraft(asset.hasDraft);
    ui.editor.setText(asset.pub.draft);

    const qs = querystring.parse(window.location.search.slice(1));
    const info = { line: qs.line, ch: qs.ch };
    if (info.line != null && info.ch != null) {
      ui.editor.codeMirrorInstance.getDoc().setCursor({ line: info.line, ch: info.ch });
      console.log("set cursor", window.location.search, qs);
    }

    // ----------
    // fText specific settings :

    // read the asset's content then return a list of instructions and their values
    // used to populate data.localEditorSettings
    // called from onAssetReceived()
    /*const parseInstructions = () => {
      let regex = /ftext:([a-zA-Z0-9\/+-]+)(:([a-zA-Z0-9\.\/+-]+))?\]/ig;
      let match: any;
      let text = ui.editor.codeMirrorInstance.getDoc().getValue();
      let instructionsCount = (text.match(/\[\s*ftext/ig) || []).length; // prevent infinite loop
      let instructions: any = {};
      do {
        match = regex.exec(text);
        if (match != null && match[1] != null) {
          let name = match[1].trim().toLowerCase();
          let value = match[3];
          if (value != null) value = value.trim();
          else value = "";
          if (name === "include") {
            if (instructions[name] == null) instructions[name] = [];
            (instructions[name] as string[]).push(value);
          }
          else
            instructions[name] = value.trim().toLowerCase();
        }
        instructionsCount--;
      }
      while (match != null && instructionsCount > 0);
      return instructions;
    };

    // where the hell is it used ?
    data.assetInstructions = parseInstructions();*/

    // get asset syntax
    data.assetSyntax = "";
    const syntaxesByShortExtensions: any = { // when the extension doen't match the syntax name
      md: "markdown",
      styl: "stylus",
      js: "javascript",
      yml: "yaml",
    };
    const assetPath = data.projectClient.entries.getPathFromId(asset.id);
    // check for an extension at the end of the asset's path
    const extensionMatches = assetPath.match(/\.[a-zA-Z]+$/gi);
    if (extensionMatches != null) {
      let syntax = extensionMatches[0].replace(".", "");
      if (syntaxesByShortExtensions[syntax] != null)
        syntax = syntaxesByShortExtensions[syntax];
      data.assetSyntax = syntax;
    }

    // set Codemirror's mode based on the asset's syntax
    const syntax: string = data.assetSyntax;
    if (syntax !== "") {
      const modesBySyntaxes: any = { // whent the syntax name doesn't match CM's mode (or MIME-type)
        cson: "coffeescript",
        html: "htmlmixed",
        json: "application/json",
        shader: "x-shader/x-fragment",
      };
      const mode = modesBySyntaxes[syntax] || syntax;
      ui.editor.codeMirrorInstance.setOption("mode", mode);
    }

    // if (FTextSettingsResource.defaultValues["lint_" + syntax] != null) {
      // always put the lint gutter, because adding or removing it on the fly mess the other gutters
      // const gutters = ui.editor.codeMirrorInstance.getOption("gutters");
      // gutters.unshift("CodeMirror-lint-markers");
      allowLinting(true); // this value may be modified when the resource is received, from onfTextSettingsUpdated()
      // this mostly sets is asset linted
    // }

    data.projectClient.subResource("fTextSettings", resourceSubscriber);
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    if (id !== SupClient.query.asset) return;
    if (onAssetCommands[command] != null) onAssetCommands[command].apply(data.asset, args);
  },

  onAssetTrashed: (id: string) => {
    if (id !== SupClient.query.asset) return;
    ui.editor.clear();
    SupClient.onAssetTrashed();
  },
};

// ----------------------------------------

const entriesSubscriber: any = {
  onEntriesReceived: (entries: SupCore.Data.Entries) => {
    entries.walk((entry: any) => {
      if (entry.type !== "fText") return;
      data.projectClient.subAsset(entry.id, "fText", assetSubscriber);
    });
  },

  // onEntryAdded: (newEntry: any, parentId: string, index: number) => { return; },
  // onEntryMoved: (id: string, parentId: string, index: number) => { return; },
  // onSetEntryProperty: (id: string, key: string, value: any) => { return; },
  // onEntryTrashed: (id: string) => { return; }
};

// ----------------------------------------

// called when the socket "welcome" event is emitted
function onWelcomed(clientId: number) {
  data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
  data.projectClient.subEntries(entriesSubscriber);
  // data.projectClient.subResource("FTextSettings", resourceSubscriber); // done in onAssetReceived()
  ui.setupEditor(clientId);
}
