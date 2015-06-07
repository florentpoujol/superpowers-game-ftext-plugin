///<reference path="./operational-transform.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OT = require("operational-transform");
var fs = require("fs");
var path = require("path");
var ScriptAsset = (function (_super) {
    __extends(ScriptAsset, _super);
    // called from the editor onAssetReceived() as well as on server startup
    function ScriptAsset(id, pub, serverData) {
        this.document = new OT.Document();
        _super.call(this, id, pub, ScriptAsset.schema, serverData);
    }
    // called on asset creation
    // options contain the asset's name
    ScriptAsset.prototype.init = function (options, callback) {
        var defaultContent = "";
        this.pub = {
            text: defaultContent,
            draft: defaultContent,
            revisionId: 0,
        };
        _super.prototype.init.call(this, options, callback);
    };
    ScriptAsset.prototype.setup = function () {
        this.document.text = this.pub.draft;
        for (var i = 0; i < this.pub.revisionId; i++)
            this.document.operations.push(0);
        this.hasDraft = this.pub.text !== this.pub.draft;
    };
    ScriptAsset.prototype.restore = function () {
        if (this.hasDraft)
            this.emit("setDiagnostic", "draft", "info");
    };
    ScriptAsset.prototype.destroy = function (callback) {
        /*this.serverData.resources.acquire("fTextSettings", null, (err: Error, fTextSettings: fTextSettingsResource) => {
          // nothing to do here
          this.serverData.resources.release("fTextSettings", null);
          callback();
        });*/
        // just call callback if there is nothing to do with the ressource
        callback();
    };
    // called on server startup
    ScriptAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
            _this.pub = JSON.parse(json);
            fs.readFile(path.join(assetPath, "text.txt"), { encoding: "utf8" }, function (err, text) {
                _this.pub.text = text;
                fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, function (err, draft) {
                    // Temporary asset migration (from tyescript plugin)
                    if (draft == null)
                        draft = _this.pub.text;
                    _this.pub.draft = draft;
                    _this.setup();
                    _this.emit("load");
                });
            });
        });
    };
    ScriptAsset.prototype.save = function (assetPath, callback) {
        var text = this.pub.text;
        delete this.pub.text;
        var draft = this.pub.draft;
        delete this.pub.draft;
        // let editorSettings = this.pub.editorSettings; delete this.pub.editorSettings;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.text = text;
        this.pub.draft = draft;
        // this.pub.editorSettings = editorSettings;
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            fs.writeFile(path.join(assetPath, "text.txt"), text, { encoding: "utf8" }, function (err) {
                if (err != null) {
                    callback(err);
                    return;
                }
                fs.writeFile(path.join(assetPath, "draft.txt"), draft, { encoding: "utf8" }, callback);
            });
        });
    };
    ScriptAsset.prototype.server_editText = function (client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        var operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.document.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
        callback(null, operation.serialize(), this.document.operations.length - 1);
        if (!this.hasDraft) {
            this.hasDraft = true;
            this.emit("setDiagnostic", "draft", "info");
        }
        this.emit("change");
    };
    ScriptAsset.prototype.client_editText = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.document.apply(operation, revisionIndex);
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
    };
    ScriptAsset.prototype.server_saveText = function (client, callback) {
        this.pub.text = this.pub.draft;
        callback(null);
        if (this.hasDraft) {
            this.hasDraft = false;
            this.emit("clearDiagnostic", "draft");
        }
        this.emit("change");
    };
    ScriptAsset.prototype.client_saveText = function () { this.pub.text = this.pub.draft; };
    ScriptAsset.schema = {
        text: { type: "string" },
        draft: { type: "string" },
        revisionId: { type: "integer" },
    };
    return ScriptAsset;
})(SupCore.data.base.Asset);
exports.default = ScriptAsset;
