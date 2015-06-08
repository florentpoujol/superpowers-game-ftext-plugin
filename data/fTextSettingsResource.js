var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fTextSettingsResource = (function (_super) {
    __extends(fTextSettingsResource, _super);
    function fTextSettingsResource(pub, serverData) {
        _super.call(this, pub, fTextSettingsResource.schema, serverData);
    }
    fTextSettingsResource.prototype.init = function (callback) {
        // default values
        this.pub = {
            theme: "default",
            tabSize: 2,
            keyMap: "sublime"
        };
        _super.prototype.init.call(this, callback);
    };
    fTextSettingsResource.schema = {
        theme: { type: "string", mutable: true },
        tabSize: { type: "number", min: 1, max: 8, mutable: true },
        keyMap: { type: "enum", items: ["sublime", "vim", "emacs"], mutable: true },
    };
    return fTextSettingsResource;
})(SupCore.data.base.Resource);
exports.default = fTextSettingsResource;
