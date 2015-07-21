import info from "./info";
import ui, { setupEditor } from "./ui";

import * as async from "async";
import * as OT from "operational-transform";

import fTextAsset from "../../data/fTextAsset";
import fTextSettingsResource from "../../data/fTextSettingsResource";

export let data: { 
  projectClient?: SupClient.ProjectClient;
  asset?: fTextAsset;
  assetInstructions?: { [key: string]: any },
  fTextSettingsResourcePub?: any, // set in onResourceReceived(), used in onfTextSettingsUpdated()
} = {};

export let socket: SocketIOClient.Socket;

// ----------------------------------------
// Ressource
// fText resource is sub at the end of onAssetReceived()

// updates the editor when the resource is received or edited
// called from the resources handlers
function onfTextSettingsResourceUpdated() {
  if (ui.editor != null) {
    let pub = data.fTextSettingsResourcePub;
    let defaultValues = fTextSettingsResource.defaultValues;
    let syntax: string = data.assetInstructions["syntax"];

    for (let optionName in defaultValues) {
      let value = (pub[optionName] != null) ? pub[optionName] : defaultValues[optionName];
      // can't do 'pub[optionName] || defaultValues[optionName]' because if pub[optionName] == false, the defautl value is always chosen.
     
      if (optionName === "indentWithTabs" || optionName === "tabSize")
        continue;

      if (optionName.indexOf("lint_") === 0) {
        if (optionName === "lint_"+syntax)
          allowLinting(value);
        continue;
      }

      if (value != ui.editor.codeMirrorInstance.getOption(optionName)) {
        if (optionName === "theme")
            loadThemeStyle(value);

        ui.editor.codeMirrorInstance.setOption(optionName, value);
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

// used in network.ts/assetHandlers/onAssetReceived()
function allowLinting(allow: boolean = true) {
  if (allow === true) {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("CodeMirror-lint-markers");
    if (index === -1) {
      gutters.unshift("CodeMirror-lint-markers");
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.editor.codeMirrorInstance.setOption("lint", true);
  }
  else {
    let gutters = ui.editor.codeMirrorInstance.getOption("gutters");
    let index = gutters.indexOf("CodeMirror-lint-markers");
    if (index !== -1) {
      gutters.splice(index, 1);
      ui.editor.codeMirrorInstance.setOption("gutters", gutters);
    }
    ui.editor.codeMirrorInstance.setOption("lint", false);
  }
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
      js: "javascript",
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

let onAssetCommands: any = {
  editText: (operationData: OperationData) => {
    ui.errorPaneStatus.classList.add("has-draft");
    ui.editor.receiveEditText(operationData);
  },

  saveText: () => {
    ui.errorPaneStatus.classList.remove("has-draft");
  }
};

let assetHandlers: any = {
  onAssetReceived: (err: string, asset: fTextAsset) => {
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
        let modesBySyntaxes: { [key: string]: string } = {
          cson: "coffeescript",
          html: "htmlmixed",
          json: "application/json",
          md: "markdown",
          shader: "x-shader/x-fragment",
        };
        let mode = modesBySyntaxes[syntax] || syntax;
        ui.editor.codeMirrorInstance.setOption("mode", mode);
      }

      // for some reason, its necessary to allow linting from here at least once
      // other wise allowLinting() from the onfTextSettingsUpdated() would mess with the side bar
      if (fTextSettingsResource.defaultValues["lint_"+syntax] != null)
        allowLinting(true);

      data.projectClient.subResource("fTextSettings", resourceHandlers);
    }
  },

  onAssetEdited: (id: string, command: string, ...args: any[]) => {
    if (command === "saveText") {
      // saveText command sent from onSaveText() in ui.ts
    }
    if (id !== info.assetId) return;
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

function onWelcomed(clientId: number) {
  data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
  data.projectClient.subEntries(entriesHandlers);
  // data.projectClient.subResource("fTextSettings", resourceHandlers); // done in onAssetReceived()
  setupEditor(clientId); // defined in ui.ts
}

// start
socket = SupClient.connect(info.projectId);
socket.on("welcome", onWelcomed);
socket.on("disconnect", SupClient.onDisconnected);
