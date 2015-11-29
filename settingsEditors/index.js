var fTextSettingsEditor = require("./fTextSettingsEditor");

SupClient.registerPlugin("settingsEditors", "fText", { namespace: "Editors", editor: fTextSettingsEditor.default });
