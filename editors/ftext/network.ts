import info from "./info";
import ui, { setupEditor, refreshErrors } from "./ui";
import { compile } from "./compilator";

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
  let regex = /\[ftext\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?\]/ig
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
        (<string[]>instructions[name]).push(value);
      }
      else
        instructions[name] = value.trim().toLowerCase();
    }
    instructionsCount--;
  }
  while (match != null && instructionsCount > 0);

  // check the extension of the asset name
  if (instructions["syntax"] == null) {
    let _languagesByExtensions: any = {
      md: "markdown",
      styl: "stylus",
    };
    let name = data.projectClient.entries.getPathFromId(data.asset.id);
    let match = name.match(/\.[a-zA-Z]+$/gi);
    if (match != null) {
      let syntax = match[0].replace(".", "");
       if (_languagesByExtensions[syntax] != null)
        syntax = _languagesByExtensions[syntax];
      instructions["syntax"] = syntax;
    }
  }

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

      let syntax: string = data.assetInstructions["syntax"];

      if (syntax != null) {
        let shortcuts: { [key: string]: string } = {
          cson: "coffeescript",
          html: "htmlmixed",
          js: "javascript",
          json: "application/json",
          md: "markdown",
          shader: "x-shader/x-fragment",
          styl: "stylus",
        };
        syntax = shortcuts[syntax] || syntax;
        ui.editor.codeMirrorInstance.setOption("mode", syntax);
      }

      compile(data);
    }
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    if (command === "saveText") {
      // saveText command sent from onSaveText() in ui.ts
      compile(data);
    }

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
