var BehaviorPropertiesResource_1 = require("./BehaviorPropertiesResource");
var ScriptAsset_1 = require("./ScriptAsset");
var BehaviorConfig_1 = require("./BehaviorConfig");
SupCore.data.registerResource("behaviorProperties", BehaviorPropertiesResource_1.default);
SupCore.data.registerAssetClass("script", ScriptAsset_1.default);
SupCore.data.registerComponentConfigClass("Behavior", BehaviorConfig_1.default);
