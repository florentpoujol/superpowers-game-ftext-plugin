///<reference path="./operational-transform.d.ts"/>
///<reference path="../node_modules/typescript/bin/typescriptServices.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OT = require("operational-transform");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
if (global.window == null) {
    var serverRequire = require;
    var ts = serverRequire("typescript");
    var compileTypeScript = serverRequire("../runtime/compileTypeScript").default;
    var globalDefs = "";
    var actorComponentAccessors = [];
    for (var pluginName in SupAPI.contexts["typescript"].plugins) {
        var plugin = SupAPI.contexts["typescript"].plugins[pluginName];
        if (plugin.defs != null)
            globalDefs += plugin.defs;
        if (plugin.exposeActorComponent != null)
            actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
    }
    globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
}
var ScriptAsset = (function (_super) {
    __extends(ScriptAsset, _super);
    function ScriptAsset(id, pub, serverData) {
        this.document = new OT.Document();
        _super.call(this, id, pub, ScriptAsset.schema, serverData);
    }
    ScriptAsset.prototype.init = function (options, callback) {
        var _this = this;
        // Transform "script asset name" into "ScriptAssetNameBehavior"
        var behaviorName = options.name.trim().replace(/[()[\]{}-]/g, "");
        behaviorName = behaviorName.slice(0, 1).toUpperCase() + behaviorName.slice(1);
        while (true) {
            var index = behaviorName.indexOf(" ");
            if (index === -1)
                break;
            behaviorName =
                behaviorName.slice(0, index) +
                    behaviorName.slice(index + 1, index + 2).toUpperCase() +
                    behaviorName.slice(index + 2);
        }
        if (!_.endsWith(behaviorName, "Behavior"))
            behaviorName += "Behavior";
        var defaultContent = [
            ("class " + behaviorName + " extends Sup.Behavior {"),
            "  awake() {",
            "    ",
            "  }",
            "",
            "  update() {",
            "    ",
            "  }",
            "}",
            ("Sup.registerBehavior(" + behaviorName + ");"),
            ""
        ].join("\n");
        this.pub = {
            text: defaultContent,
            draft: defaultContent,
            revisionId: 0
        };
        this.serverData.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
            if (behaviorProperties.pub.behaviors[behaviorName] == null) {
                var behaviors = {};
                behaviors[behaviorName] = { properties: [], parentBehavior: null };
                behaviorProperties.setScriptBehaviors(_this.id, behaviors);
            }
            _this.serverData.resources.release("behaviorProperties", null);
            _super.prototype.init.call(_this, options, callback);
        });
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
        var _this = this;
        this.serverData.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
            behaviorProperties.clearScriptBehaviors(_this.id);
            _this.serverData.resources.release("behaviorProperties", null);
            callback();
        });
    };
    ScriptAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
            _this.pub = JSON.parse(json);
            fs.readFile(path.join(assetPath, "script.txt"), { encoding: "utf8" }, function (err, text) {
                _this.pub.text = text;
                fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, function (err, draft) {
                    // Temporary asset migration
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
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.text = text;
        this.pub.draft = draft;
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            fs.writeFile(path.join(assetPath, "script.txt"), text, { encoding: "utf8" }, function (err) {
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
        var _this = this;
        this.pub.text = this.pub.draft;
        var scriptNames = [];
        var scripts = {};
        var ownScriptName = "";
        var finish = function () {
            callback(null);
            if (_this.hasDraft) {
                _this.hasDraft = false;
                _this.emit("clearDiagnostic", "draft");
            }
            _this.emit("change");
        };
        var compile = function () {
            try {
                var results = compileTypeScript(scriptNames, scripts, globalDefs, { sourceMap: false });
            }
            catch (e) {
                finish();
                return;
            }
            if (results.errors.length > 0) {
                finish();
                return;
            }
            var libSourceFile = results.program.getSourceFile("lib.d.ts");
            var supTypeSymbols = {
                "Sup.Actor": libSourceFile.locals["Sup"].exports["Actor"],
                "Sup.Behavior": libSourceFile.locals["Sup"].exports["Behavior"],
                "Sup.Math.Vector3": libSourceFile.locals["Sup"].exports["Math"].exports["Vector3"],
                "Sup.Asset": libSourceFile.locals["Sup"].exports["Asset"],
            };
            var supTypeSymbolsList = [];
            for (var value in supTypeSymbols)
                supTypeSymbolsList.push(value);
            var behaviors = {};
            for (var symbolName in results.program.getSourceFile(ownScriptName).locals) {
                var symbol = results.program.getSourceFile(ownScriptName).locals[symbolName];
                if ((symbol.flags & ts.SymbolFlags.Class) !== ts.SymbolFlags.Class)
                    continue;
                var parentTypeNode = ts.getClassExtendsHeritageClauseElement(symbol.valueDeclaration);
                if (parentTypeNode == null)
                    continue;
                var parentTypeSymbol = results.typeChecker.getSymbolAtLocation(parentTypeNode.expression);
                var baseTypeNode = parentTypeNode;
                var baseTypeSymbol = parentTypeSymbol;
                while (true) {
                    if (baseTypeSymbol === supTypeSymbols["Sup.Behavior"])
                        break;
                    baseTypeNode = ts.getClassExtendsHeritageClauseElement(baseTypeSymbol.valueDeclaration);
                    if (baseTypeNode == null)
                        break;
                    baseTypeSymbol = results.typeChecker.getSymbolAtLocation(baseTypeNode.expression);
                }
                if (baseTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                    continue;
                var properties = [];
                var parentBehavior = null;
                if (parentTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                    parentBehavior = results.typeChecker.getFullyQualifiedName(parentTypeSymbol);
                behaviors[symbolName] = { properties: properties, parentBehavior: parentBehavior };
                for (var memberName in symbol.members) {
                    var member = symbol.members[memberName];
                    // Skip non-properties
                    if ((member.flags & ts.SymbolFlags.Property) !== ts.SymbolFlags.Property)
                        continue;
                    // Skip static, private and protected members
                    var modifierFlags = (member.valueDeclaration.modifiers != null) ? member.valueDeclaration.modifiers.flags : null;
                    if (modifierFlags != null && (modifierFlags & (ts.NodeFlags.Private | ts.NodeFlags.Protected | ts.NodeFlags.Static)) !== 0)
                        continue;
                    // TODO: skip members annotated as "non-customizable"
                    var type = results.typeChecker.getTypeAtLocation(member.valueDeclaration);
                    var typeName = void 0; // "unknown"
                    var typeSymbol = type.getSymbol();
                    if (supTypeSymbolsList.indexOf(typeSymbol) !== -1) {
                    }
                    else if (type.intrinsicName != null)
                        typeName = type.intrinsicName;
                    if (typeName != null)
                        properties.push({ name: member.name, type: typeName });
                }
            }
            _this.serverData.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
                behaviorProperties.setScriptBehaviors(_this.id, behaviors);
                _this.serverData.resources.release("behaviorProperties", null);
                finish();
            });
        };
        var remainingAssetsToLoad = Object.keys(this.serverData.entries.byId).length;
        var assetsLoading = 0;
        this.serverData.entries.walk(function (entry) {
            remainingAssetsToLoad--;
            if (entry.type !== "script") {
                if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                    compile();
                return;
            }
            var name = _this.serverData.entries.getPathFromId(entry.id) + ".ts";
            scriptNames.push(name);
            assetsLoading++;
            _this.serverData.assets.acquire(entry.id, null, function (err, asset) {
                scripts[name] = asset.pub.text;
                if (asset === _this)
                    ownScriptName = name;
                _this.serverData.assets.release(entry.id, null);
                assetsLoading--;
                if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                    compile();
            });
        });
    };
    ScriptAsset.prototype.client_saveText = function () { this.pub.text = this.pub.draft; };
    ScriptAsset.schema = {
        text: { type: "string" },
        draft: { type: "string" },
        revisionId: { type: "integer" }
    };
    return ScriptAsset;
})(SupCore.data.base.Asset);
exports.default = ScriptAsset;
