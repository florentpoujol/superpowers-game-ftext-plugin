var fTextSettingsEditor = require("./fTextSettingsEditor");

SupClient.registerPlugin("settingsEditors", "fText", { namespace: "editors", editor: fTextSettingsEditor.default });
