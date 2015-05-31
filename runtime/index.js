var script = require("./script");
var Behavior = require("./Behavior");
var behaviorProperties = require("./behaviorProperties");
SupRuntime.registerPlugin("script", script);
SupRuntime.registerPlugin("Behavior", Behavior);
SupRuntime.registerResource("behaviorProperties", behaviorProperties);
