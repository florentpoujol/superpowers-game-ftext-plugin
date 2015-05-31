var async = require("async");
SupClient.setupHotkeys();
async.each(SupClient.pluginPaths.all, function (pluginName, pluginCallback) {
    async.series([
        function (cb) {
            var apiScript = document.createElement("script");
            apiScript.src = "/plugins/" + pluginName + "/api.js";
            apiScript.addEventListener("load", function (event) { cb(null, null); });
            apiScript.addEventListener("error", function (event) { cb(null, null); });
            document.body.appendChild(apiScript);
        }
    ], pluginCallback);
}, function (err) {
    var navListElt = document.querySelector("nav ul");
    var mainElt = document.querySelector("main");
    var allDefs = {};
    var actorComponentAccessors = [];
    for (var pluginName in SupAPI.contexts["typescript"].plugins) {
        var plugin = SupAPI.contexts["typescript"].plugins[pluginName];
        name = pluginName;
        if (plugin.exposeActorComponent != null) {
            name = plugin.exposeActorComponent.className;
            actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
        }
        if (plugin.defs != null)
            allDefs[name] = plugin.defs;
    }
    allDefs["Sup.Actor"] = allDefs["Sup.Actor"].replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
    var sortedDefNames = Object.keys(allDefs);
    sortedDefNames.sort(function (a, b) { return (a.toLowerCase() < b.toLowerCase()) ? -1 : 1; });
    sortedDefNames.unshift(sortedDefNames.splice(sortedDefNames.indexOf("lib"), 1)[0]);
    for (var _i = 0; _i < sortedDefNames.length; _i++) {
        var name_1 = sortedDefNames[_i];
        var defs = allDefs[name_1];
        if (name_1 === "lib")
            name_1 = "Built-ins";
        var liElt = document.createElement("li");
        var anchorElt = document.createElement("a");
        anchorElt.id = "link-" + name_1;
        anchorElt.href = "#" + name_1;
        anchorElt.textContent = name_1;
        liElt.appendChild(anchorElt);
        navListElt.appendChild(liElt);
        var sectionElt = document.createElement("section");
        sectionElt.id = "doc-" + name_1;
        mainElt.appendChild(sectionElt);
        var headerElt = document.createElement("header");
        headerElt.textContent = name_1;
        sectionElt.appendChild(headerElt);
        var preElt = document.createElement("pre");
        preElt.textContent = defs;
        sectionElt.appendChild(preElt);
    }
    navListElt.addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        navListElt.querySelector("li a.active").classList.remove("active");
        mainElt.querySelector("section.active").classList.remove("active");
        event.target.classList.add("active");
        document.getElementById("doc-" + event.target.textContent).classList.add("active");
    });
    if (window.location.hash.length > 1) {
        var hash = window.location.hash.substring(1);
        var sectionElt = document.getElementById("doc-" + hash);
        if (sectionElt != null) {
            sectionElt.classList.add("active");
            document.getElementById("link-" + hash).classList.add("active");
            return;
        }
    }
    navListElt.querySelector("li a").classList.add("active");
    mainElt.querySelector("section").classList.add("active");
});
