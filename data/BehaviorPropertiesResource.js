var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BehaviorPropertiesResource = (function (_super) {
    __extends(BehaviorPropertiesResource, _super);
    function BehaviorPropertiesResource(pub, serverData) {
        _super.call(this, pub, BehaviorPropertiesResource.schema, serverData);
    }
    BehaviorPropertiesResource.prototype.setup = function () {
        this.behaviorNamesByScriptId = {};
        this.propertiesByNameByBehavior = {};
        for (var behaviorName in this.pub.behaviors) {
            var behavior = this.pub.behaviors[behaviorName];
            if (this.behaviorNamesByScriptId[behavior.scriptId] == null)
                this.behaviorNamesByScriptId[behavior.scriptId] = [];
            this.behaviorNamesByScriptId[behavior.scriptId].push(behaviorName);
            this.propertiesByNameByBehavior[behaviorName] = {};
            for (var _i = 0, _a = behavior.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                this.propertiesByNameByBehavior[behaviorName][property.name] = property;
            }
        }
    };
    BehaviorPropertiesResource.prototype.init = function (callback) {
        this.pub = { behaviors: {} };
        _super.prototype.init.call(this, callback);
    };
    BehaviorPropertiesResource.prototype.setScriptBehaviors = function (scriptId, behaviors) {
        this.client_setScriptBehaviors(scriptId, behaviors);
        this.emit("command", "setScriptBehaviors", scriptId, behaviors);
        this.emit("change");
    };
    BehaviorPropertiesResource.prototype.client_setScriptBehaviors = function (scriptId, behaviors) {
        var oldBehaviorNames = (this.behaviorNamesByScriptId[scriptId] != null) ? this.behaviorNamesByScriptId[scriptId] : [];
        var newBehaviorNames = this.behaviorNamesByScriptId[scriptId] = [];
        for (var name_1 in behaviors) {
            var behavior = behaviors[name_1];
            this.pub.behaviors[name_1] = { scriptId: scriptId, parentBehavior: behavior.parentBehavior, properties: behavior.properties };
            var propertiesByName = this.propertiesByNameByBehavior[name_1] = {};
            for (var _i = 0, _a = behavior.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                propertiesByName[property.name] = property;
            }
            newBehaviorNames.push(name_1);
        }
        for (var _b = 0; _b < oldBehaviorNames.length; _b++) {
            var oldBehaviorName = oldBehaviorNames[_b];
            if (newBehaviorNames.indexOf(oldBehaviorName) !== -1)
                continue;
            delete this.propertiesByNameByBehavior[oldBehaviorName];
            delete this.pub.behaviors[oldBehaviorName];
        }
    };
    BehaviorPropertiesResource.prototype.clearScriptBehaviors = function (scriptId) {
        this.client_clearScriptBehaviors(scriptId);
        this.emit("command", "clearScriptBehaviors", scriptId);
        this.emit("change");
    };
    BehaviorPropertiesResource.prototype.client_clearScriptBehaviors = function (scriptId) {
        var oldBehaviorNames = this.behaviorNamesByScriptId[scriptId];
        if (oldBehaviorNames == null)
            return;
        for (var _i = 0; _i < oldBehaviorNames.length; _i++) {
            var oldBehaviorName = oldBehaviorNames[_i];
            delete this.pub.behaviors[oldBehaviorName];
            delete this.propertiesByNameByBehavior[oldBehaviorName];
        }
        delete this.behaviorNamesByScriptId[scriptId];
    };
    BehaviorPropertiesResource.schema = {
        behaviors: {
            type: "hash",
            keys: { minLength: 1 },
            values: {
                type: "hash",
                properties: {
                    scriptId: { type: "string" },
                    parentBehavior: { type: "string" },
                    properties: {
                        type: "array",
                        items: {
                            type: "hash",
                            properties: {
                                name: { type: "string" },
                                type: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    };
    return BehaviorPropertiesResource;
})(SupCore.data.base.Resource);
exports.default = BehaviorPropertiesResource;
