// import * as querystring from "querystring";
import ui from "./ui";
import FTextAsset from "../../data/fTextAsset";
import FTextSettingsResource from "../../data/fTextSettingsResource";

/* tslint:disable */
// expose the linter, used int he custom linters script
(window as any).consparser = require("coffee-script"); // used to parse CSON. Neither https://github.com/groupon/cson-parser nor https://github.com/bevry/cson
(window as any).CSSLint = require("csslint").CSSLint;
(window as any).JSHINT = require("jshint").JSHINT;
(window as any).jsonlint = require("jsonlint");
(window as any).pug = require("pug");
(window as any).stylus = require("stylus");
(window as any).jsyaml = require("js-yaml");


const data: {
  projectClient?: SupClient.ProjectClient; // set in onWelcomed()
  asset?: FTextAsset;
  assetMode?: string; // set in assetSubscriber.onAsetReceived()
  lintedModes: string[];
  modesByExtensions: any;
  FTextSettingsResourcePub?: any; // set in onResourceReceived(), used in onfTextSettingsUpdated()
} = {
  lintedModes: ["coffeescript"/* cson */, "application/json", "javascript", "css", "pug", "stylus", "yaml"],
  modesByExtensions: { // only necessary when the extension doesn't match CM's mode
    "cson": "coffeescript",
    "json": "application/json",
    "js": "javascript",
    "styl": "stylus",
    "yml": "yaml",
    "md": "markdown",
    "shader": "x-shader/x-fragment",
    "html": "htmlmixed"
  },
};
export default data;

let socket: SocketIOClient.Socket;

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
    // I suppose the resource is always received after the asset since the resource is subscribed at the end of onAssetreceived()
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

    for (let optionName in defaultValues) {
      let optionValue = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
      // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl optionValue is always chosen.

      if (optionValue !== ui.editor.codeMirrorInstance.getOption(optionName)) {
        if (optionName === "lint") {
          if (optionValue === false)
            allowLinting(false);
          else if (optionValue === true && data.assetMode != null && data.lintedModes.indexOf(data.assetMode) !== -1)
            allowLinting(true);
        }
        else
          ui.editor.codeMirrorInstance.setOption(optionName, optionValue);
      }
    }
  }
}

// used in assetSubscriber.onAssetReceived() and onFTextSettingsResourceUpdated()
function allowLinting(allow: boolean = true) {
  // allowLinting shouldn't be called if the mode is unknow or not lintable or if linting is disable, but just to be sure
  if (
    (data.assetMode != null && data.lintedModes.indexOf(data.assetMode) === -1) ||
    (data.FTextSettingsResourcePub != null && data.FTextSettingsResourcePub.lint === false)
  )
    allow = false;

  ui.editor.codeMirrorInstance.setOption("lint", allow);

  let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
  if (allow === true && gutters.indexOf("CodeMirror-lint-markers") === -1) {
    gutters = ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"];
    ui.editor.codeMirrorInstance.setOption("gutters", []);
    ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    // note when the lint gutter is added again after being removed,
    // the lint markers won't show up in the lint gutter until the asset tabs is reopened
  }
  else if (allow === false && gutters.indexOf("CodeMirror-lint-markers") !== -1) {
    ui.editor.codeMirrorInstance.setOption("gutters", ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]);
  }

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

    SupClient.setEntryRevisionDisabled(false);

    data.asset = asset;
    ui.setEditorContent(asset);

    // check for an extension at the end of the asset's path
    const assetPath = data.projectClient.entries.getPathFromId(asset.id);
    const extensionMatches = assetPath.match(/\.[a-zA-Z]+$/gi);
    let extension: string = null;
    if (extensionMatches != null)
      extension = extensionMatches[0].replace(".", "");

    // set Codemirror's mode
    if (extension != null) {
      const mode = data.modesByExtensions[extension] || extension;
      data.assetMode = mode;
      ui.editor.codeMirrorInstance.setOption("mode", mode);

      if (data.lintedModes.indexOf(mode) === -1)
        allowLinting(false);
    }

    data.projectClient.subResource("fTextSettings", resourceSubscriber);
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    if (id !== SupClient.query.asset) return;
    if (ui.selectedRevision === "current" && onAssetCommands[command] != null) onAssetCommands[command].apply(data.asset, args);
  },

  onAssetTrashed: (id: string) => {
    if (id !== SupClient.query.asset) return;
    ui.editor.clear();
    SupClient.onAssetTrashed();
  },

  onAssetRestored: (id: string, asset: FTextAsset) => {
    if (id === SupClient.query.asset) {
      data.asset = asset;
      if (ui.selectedRevision === "current")
        ui.setEditorContent(data.asset);
    }
  }
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

// called when the socket "welcome" event is emitted
function onWelcomed(clientId: number) {
  data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
  data.projectClient.subEntries(entriesSubscriber);
  ui.setupEditor(clientId);
}
