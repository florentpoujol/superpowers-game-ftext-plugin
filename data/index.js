var FTextSettingsResource = require("./fTextSettingsResource");
var FTextAsset = require("./fTextAsset");

SupCore.system.data.registerResource("fTextSettings", FTextSettingsResource.default);
SupCore.system.data.registerAssetClass("fText", FTextAsset.default);