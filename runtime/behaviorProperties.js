function loadResource(player, resourceName, callback) {
    player.getAssetData("resources/" + resourceName + "/resource.json", "json", function (err, data) {
        if (err != null) {
            callback(err);
            return;
        }
        for (var behaviorName in data.behaviors) {
            var behavior = data.behaviors[behaviorName];
            behavior.propertiesByName = {};
            for (var _i = 0, _a = behavior.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                behavior.propertiesByName[property.name] = property;
            }
        }
        callback(null, data);
    });
}
exports.loadResource = loadResource;
