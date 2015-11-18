var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var OT = require("operational-transform");
var fs = require("fs");
var path = require("path");
var fTextAsset = (function (_super) {
    __extends(fTextAsset, _super);
    // called from the editor onAssetReceived() as well as on server startup
    function fTextAsset(id, pub, serverData) {
        _super.call(this, id, pub, fTextAsset.schema, serverData);
    }
    // called on asset creation
    // options contain the asset's name
    fTextAsset.prototype.init = function (options, callback) {
        var defaultContent = "";
        this.pub = {
            text: defaultContent,
            draft: defaultContent,
            revisionId: 0,
        };
        _super.prototype.init.call(this, options, callback);
    };
    fTextAsset.prototype.setup = function () {
        this.document = new OT.Document(this.pub.draft, this.pub.revisionId);
        this.hasDraft = this.pub.text !== this.pub.draft;
    };
    fTextAsset.prototype.restore = function () {
        if (this.hasDraft)
            this.emit("setDiagnostic", "draft", "info");
    };
    fTextAsset.prototype.destroy = function (callback) {
        callback();
    };
    // called on server startup
    fTextAsset.prototype.load = function (assetPath) {
        // NOTE: We must not set this.pub with temporary values here, otherwise
        // the asset will be considered loaded by Dictionary.acquire
        // and the acquire callback will be called immediately
        var _this = this;
        fs.readFile(path.join(assetPath, "ftext.txt"), { encoding: "utf8" }, function (err, text) {
            fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, function (err, draft) {
                _this.pub = { revisionId: 0, text: text, draft: (draft != null) ? draft : text };
                _this.setup();
                _this.emit("load");
            });
        });
    };
    // called when it is time to write the asset on disk, not when the user save the asset from the editor
    fTextAsset.prototype.save = function (assetPath, callback) {
        var _this = this;
        fs.writeFile(path.join(assetPath, "ftext.txt"), this.pub.text, { encoding: "utf8" }, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            if (_this.hasDraft) {
                fs.writeFile(path.join(assetPath, "draft.txt"), _this.pub.draft, { encoding: "utf8" }, callback);
            }
            else {
                // delete the draft.txt file if there is no draft to save and the file exists
                fs.unlink(path.join(assetPath, "draft.txt"), function (err) {
                    if (err != null && err.code !== "ENOENT") {
                        callback(err);
                        return;
                    }
                    callback(null);
                });
            }
        });
    };
    fTextAsset.prototype.server_editText = function (client, operationData, revisionIndex, callback) {
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
        callback(null, operation.serialize(), this.document.getRevisionId() - 1);
        if (!this.hasDraft) {
            this.hasDraft = true;
            this.emit("setDiagnostic", "draft", "info");
        }
        this.emit("change");
    };
    fTextAsset.prototype.client_editText = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.document.apply(operation, revisionIndex);
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
    };
    fTextAsset.prototype.server_saveText = function (client, callback) {
        this.pub.text = this.pub.draft;
        callback(null);
        if (this.hasDraft) {
            this.hasDraft = false;
            this.emit("clearDiagnostic", "draft");
        }
        this.emit("change");
    };
    fTextAsset.prototype.client_saveText = function () { this.pub.text = this.pub.draft; };
    fTextAsset.schema = {
        text: { type: "string" },
        draft: { type: "string" },
        revisionId: { type: "integer" },
    };
    return fTextAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fTextAsset;
