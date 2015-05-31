var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BehaviorConfig = (function (_super) {
    __extends(BehaviorConfig, _super);
    function BehaviorConfig(pub) {
        if (pub.propertyValues == null)
            pub.propertyValues = {};
        _super.call(this, pub, BehaviorConfig.schema);
    }
    BehaviorConfig.create = function () { return { behaviorName: "", propertyValues: {} }; };
    BehaviorConfig.prototype.server_setBehaviorPropertyValue = function (client, name, type, value, callback) {
        this.pub.propertyValues[name] = { type: type, value: value };
        callback(null, name, type, value);
    };
    BehaviorConfig.prototype.client_setBehaviorPropertyValue = function (name, type, value) {
        this.pub.propertyValues[name] = { type: type, value: value };
    };
    BehaviorConfig.prototype.server_clearBehaviorPropertyValue = function (client, name, callback) {
        delete this.pub.propertyValues[name];
        callback(null, name);
    };
    BehaviorConfig.prototype.client_clearBehaviorPropertyValue = function (name) {
        delete this.pub.propertyValues[name];
    };
    BehaviorConfig.schema = {
        behaviorName: { type: "string", mutable: true },
        propertyValues: {
            type: "hash",
            keys: { minLength: 1, maxLength: 80 },
            values: {
                type: "hash",
                properties: {
                    type: { type: "string" },
                    value: { type: "any" }
                }
            }
        }
    };
    return BehaviorConfig;
})(SupCore.data.base.ComponentConfig);
exports.default = BehaviorConfig;
