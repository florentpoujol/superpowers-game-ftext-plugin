var convert = require("convert-source-map");
// No definition file for combine-source-map module
var combine = require("combine-source-map");
var compileTypeScript_1 = require("./compileTypeScript");
var globalNames = [];
var globals = {};
var globalDefs = {};
var scriptNames = [];
var scripts = {};
var actorComponentTypesByName = {};
var actorComponentAccessors = [];
function init(player, callback) {
    player.behaviorClasses = {};
    player.createActor = function (name, parentActor) { return new window.Sup.Actor(name, parentActor); };
    player.createComponent = function (type, actor, config) {
        if (type === "Behavior") {
            var behaviorClass = player.behaviorClasses[config.behaviorName];
            if (behaviorClass == null) {
                throw new Error("Could not find a behavior class named \"" + config.behaviorName + "\" for actor \"" + actor.getName() + "\". Make sure you're using the class name, not the script's name and that the class is declared before the behavior component is created (or before the scene is loaded).");
            }
            return new behaviorClass(actor.__inner);
        }
        else {
            if (actorComponentTypesByName[type] == null) {
                actorComponentTypesByName[type] = window;
                var parts = SupAPI.contexts["typescript"].plugins[type].exposeActorComponent.className.split(".");
                for (var _i = 0; _i < parts.length; _i++) {
                    var part = parts[_i];
                    actorComponentTypesByName[type] = actorComponentTypesByName[type][part];
                }
            }
            return new actorComponentTypesByName[type](actor);
        }
    };
    for (var pluginName in SupAPI.contexts["typescript"].plugins) {
        var plugin = SupAPI.contexts["typescript"].plugins[pluginName];
        if (plugin.code != null) {
            globalNames.push(pluginName + ".ts");
            globals[(pluginName + ".ts")] = plugin.code;
        }
        if (plugin.defs != null)
            globalDefs[(pluginName + ".d.ts")] = plugin.defs;
        if (plugin.exposeActorComponent != null)
            actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
    }
    callback();
}
exports.init = init;
function start(player, callback) {
    console.log("Compiling scripts...");
    // Plug component accessors exposed by plugins into Sup.Actor class
    var joinedActorComponentAccessors = actorComponentAccessors.join("\n    ");
    globals["Sup.Actor.ts"] = globals["Sup.Actor.ts"].replace("// INSERT_COMPONENT_ACCESSORS", joinedActorComponentAccessors);
    globalDefs["Sup.Actor.d.ts"] = globalDefs["Sup.Actor.d.ts"].replace("// INSERT_COMPONENT_ACCESSORS", joinedActorComponentAccessors);
    // Make sure the Sup namespace is compiled before everything else
    globalNames.unshift(globalNames.splice(globalNames.indexOf("Sup.ts"), 1)[0]);
    // Compile plugin globals
    var jsGlobals = compileTypeScript_1.default(globalNames, globals, globalDefs["lib.d.ts"] + "\ndeclare var console, window, localStorage, player, SupEngine, SupRuntime;", { sourceMap: false });
    if (jsGlobals.errors.length > 0) {
        for (var _i = 0, _a = jsGlobals.errors; _i < _a.length; _i++) {
            var error = _a[_i];
            console.log(error.file + "(" + error.position.line + "): " + error.message);
        }
        callback(new Error("Compilation failed. Check the devtools (F12) for errors."));
        return;
    }
    // Compile game scripts
    var concatenatedGlobalDefs = "";
    for (var name_1 in globalDefs)
        concatenatedGlobalDefs += globalDefs[name_1];
    var results = compileTypeScript_1.default(scriptNames, scripts, concatenatedGlobalDefs, { sourceMap: true });
    if (results.errors.length > 0) {
        for (var _b = 0, _c = results.errors; _b < _c.length; _b++) {
            var error = _c[_b];
            console.log(error.file + "(" + error.position.line + "): " + error.message);
        }
        callback(new Error("Compilation failed. Check the devtools (F12) for errors."));
        return;
    }
    console.log("Compilation successful!");
    // Prepare source maps
    var getLineCounts = function (text) {
        var count = 1, index = -1;
        while (true) {
            index = text.indexOf("\n", index + 1);
            if (index === -1)
                break;
            count++;
        }
        return count;
    };
    jsGlobals.script = "(function() {\nvar player = _player; _player = undefined;\n" + jsGlobals.script + "\n})();\n";
    var line = getLineCounts(jsGlobals.script);
    var combinedSourceMap = combine.create("bundle.js");
    for (var _d = 0, _e = results.files; _d < _e.length; _d++) {
        var file = _e[_d];
        var comment = convert.fromObject(results.sourceMaps[file.name]).toComment();
        combinedSourceMap.addFile({ sourceFile: "/" + player.gameName + "/" + file.name, source: file.text + ("\n" + comment) }, { line: line });
        line += (getLineCounts(file.text));
    }
    var code = "" + jsGlobals.script + results.script + "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," + combinedSourceMap.base64();
    // Execute the generated code
    var scriptFunction = new Function("_player", code);
    scriptFunction(player);
    callback();
}
exports.start = start;
function loadAsset(player, entry, callback) {
    scriptNames.push(entry.name + ".ts");
    player.getAssetData("assets/" + entry.id + "/script.txt", "text", function (err, script) {
        scripts[(entry.name + ".ts")] = script + "\n";
        callback(null, script);
    });
}
exports.loadAsset = loadAsset;
