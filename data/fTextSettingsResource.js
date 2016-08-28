"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FTextSettingsResource = (function (_super) {
    __extends(FTextSettingsResource, _super);
    function FTextSettingsResource(id, pub, serverData) {
        _super.call(this, id, pub, FTextSettingsResource.schema, serverData);
    }
    FTextSettingsResource.prototype.init = function (callback) {
        var pub = {};
        for (var name_1 in FTextSettingsResource.defaultValues) {
            pub[name_1] = FTextSettingsResource.defaultValues[name_1];
        }
        this.pub = pub;
        _super.prototype.init.call(this, callback);
    };
    FTextSettingsResource.schema = {
        styleActiveLine: { type: "boolean", mutable: true },
        showTrailingSpace: { type: "boolean", mutable: true },
        autoCloseBrackets: { type: "boolean", mutable: true },
        matchTags: { type: "boolean", mutable: true },
        highlightSelectionMatches: { type: "boolean", mutable: true },
    };
    FTextSettingsResource.defaultValues = {
        styleActiveLine: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        matchTags: true,
        highlightSelectionMatches: true,
    }; // note 07/09/15 for some reason, not having a coma after the last entry would cause the defaultValues not to be read in the settings editor...
    return FTextSettingsResource;
}(SupCore.Data.Base.Resource));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FTextSettingsResource;
