var fTextSettingsResource = require("./fTextSettingsResource");
var fTextAsset = require("./fTextAsset");

SupCore.system.data.registerResource("fTextSettings", fTextSettingsResource.default);
SupCore.system.data.registerAssetClass("fText", fTextAsset.default);
