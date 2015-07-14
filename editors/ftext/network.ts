import info from "./info";
import ui, { setupEditor } from "./ui";

import * as async from "async";
import * as OT from "operational-transform";

import fTextAsset from "../../data/fTextAsset";
import fTextSettingsResource from "../../data/fTextSettingsResource";

export let data: { 
  projectClient?: SupClient.ProjectClient;
  assetsById?: {[id: string]: fTextAsset};
  asset?: fTextAsset;
  assetInstructions?: { [key: string]: any },
  fTextSettingsResourcePub?: any, // set in onResourceReceived(), used in onfTextSettingsUpdated()
} = { assetsById: {} };

export let socket: SocketIOClient.Socket;

// ----------------------------------------

let onAssetCommands: any = {
  editText: (operationData: OperationData) => {
    ui.errorPaneStatus.classList.add("has-draft");
    ui.editor.receiveEditText(operationData);
  },

  saveText: () => {
    ui.errorPaneStatus.classList.remove("has-draft");
  }
};

// ----------------------------------------

// read the asset's content then return a list of instructions and their values
// used to populate data.localEditorSettings
// called from onAssetReceived()
function parseInstructions() {
  let text = ui.editor.codeMirrorInstance.getDoc().getValue();
  let instructions: any = {};
  let regex = /@ftextasset\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?/ig
  let match: any;
  let i = ui.editor.codeMirrorInstance.getDoc().lineCount(); // make sure the loop does not run more than the number of lines
  
  do {
    match = regex.exec(text);
    if (match != null && match[1] != undefined) {
      let name = match[1].trim().toLowerCase();
      let value = match[3];
      if (value !== undefined) value = value.trim();
      else value = "";
      instructions[name] = value;
    }
    i--;
  }
  while (match != null && i > 0);

  return instructions;
}

let assetHandlers: any = {
  onAssetReceived: (err: string, asset: fTextAsset) => {
    data.assetsById[asset.id] = asset;

    if (asset.id === info.assetId) {
      data.asset = asset;

      (<any>ui.errorPaneStatus.classList.toggle)("has-draft", data.asset.hasDraft);
      ui.editor.setText(data.asset.pub.draft);
      
      if (info.line != null && info.ch != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: info.line, ch: info.ch });

      // fText specific settings
      data.assetInstructions = parseInstructions();

      let mode: string = data.assetInstructions["syntax"];
      
      if (mode == null) { // check the extension of the asset name
        let path = data.projectClient.entries.getPathFromId(asset.id);
        let match = /\.([a-z]+)$/ig.exec(path);
        if (match != null && match[1] != null)
          mode = match[1];
      }

      if (mode != null) {
        let shortcuts: { [key: string]: string } = {
          cson: "coffeescript",
          html: "htmlmixed",
          js: "javascript",
          json: "application/json",
          md: "markdown",
          shader: "x-shader/x-fragment",
          styl: "stylus",
        };
        mode = shortcuts[mode] || mode;
        ui.editor.codeMirrorInstance.setOption("mode", mode);
      }
    }
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    /*if (command === "saveText") {
      // compile then refresh errors
    }*/
    // or do that from the save text function in UI
    if (id !== info.assetId) {
      return
    }

    if (onAssetCommands[command] != null) onAssetCommands[command].apply(data.asset, args);
  },

  onAssetTrashed: (id: string) => {
    if (id !== info.assetId) return;
    ui.editor.clear();
    SupClient.onAssetTrashed();
  },
};

// ----------------------------------------

let entriesHandlers: any = {
  onEntriesReceived: (entries: SupCore.data.Entries) => {
    entries.walk((entry: any) => {
      if (entry.type !== "fText") return;
      data.projectClient.subAsset(entry.id, "fText", assetHandlers);
    })
  },

  onEntryAdded: (newEntry: any, parentId: string, index: number) => {
    if (newEntry.type !== "fText") return;
    data.projectClient.subAsset(newEntry.id, "fText", assetHandlers);
  },

  onEntryMoved: (id: string, parentId: string, index: number) => {
  },

  onSetEntryProperty: (id: string, key: string, value: any) => {
  },

  onEntryTrashed: (id: string) => {
  },
}

// ----------------------------------------
// Ressource

// updates the editor whe the resource is received or edited
// called from the resources handlers
function onfTextSettingsResourceUpdated() {
  if (ui.editor != null) {
    let pub = data.fTextSettingsResourcePub;
    let settings = fTextSettingsResource.defaultValues;

    for (let name in settings) {
      if (name === "indentWithTabs" && name === "tabSize")
        continue;

      let value = (pub[name] != null) ? pub[name] : settings[name];
      // can't do 'pub[name] || settings[name]' because if pub[name] == false, the defautl value is always chosen.

      if (value != ui.editor.codeMirrorInstance.getOption(name)) {
        ui.editor.codeMirrorInstance.setOption(name, value);
        if (name === "theme")
          loadThemeStyle(value);
      }
    }
  }
}

function loadThemeStyle(theme: string) {
  let link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `codemirror-themes/${theme}.css`;
  document.head.appendChild(link);
}

let resourceHandlers: any = {
  onResourceReceived: (resourceId: string, resource: fTextSettingsResource) => {
    data.fTextSettingsResourcePub = resource.pub;
    onfTextSettingsResourceUpdated();
  },

  onResourceEdited: (resourceId: string, command: string, propertyName: string) => {
    onfTextSettingsResourceUpdated();
  }
}

// ----------------------------------------

function onWelcomed(clientId: number) {
  data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
  data.projectClient.subEntries(entriesHandlers);
  data.projectClient.subResource("fTextSettings", resourceHandlers);
  setupEditor(clientId); // defined in ui.ts
}

// start
socket = SupClient.connect(info.projectId);
socket.on("welcome", onWelcomed);
socket.on("disconnect", SupClient.onDisconnected);
