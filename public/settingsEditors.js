(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fTextSettingsEditor = require("./fTextSettingsEditor");

SupClient.registerSettingsEditorClass("fText", fTextSettingsEditor.default);

},{"./fTextSettingsEditor":3}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (process){

var fTextSettingsEditor = (function () {
    function fTextSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            _this.fields[propertyName].value = _this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        var title = document.createElement("h2");
        title.textContent = "Default editor settings";
        container.appendChild(title);
        var tbody = (SupClient.table.createTable(container)).tbody;
        // let tbody = SupClient.table.createTable(container).tbody;
        this.themeRow = SupClient.table.appendRow(tbody, "Theme");
        this.fields["theme"] = SupClient.table.appendTextField(this.themeRow.valueCell, "monokai");
        // get list of all available themes then enable HTML5 autocompletion
        process.nextTick(function(){(function (err, files) {
    if (files != null && files.length > 0) {
        _this.fields['theme'].setAttribute('list', 'themes-list');
        var datalist = document.createElement('datalist');
        datalist.id = 'themes-list';
        _this.themeRow.valueCell.appendChild(datalist);
        for (var _i = 0; _i < files.length; _i++) {
            var theme = files[_i];
            var option = document.createElement('option');
            option.value = theme.replace('.css', '');
            datalist.appendChild(option);
        }
    }
})(null,["3024-day.css","3024-night.css","ambiance-mobile.css","ambiance.css","base16-dark.css","base16-light.css","blackboard.css","cobalt.css","colorforth.css","default.css","eclipse.css","elegant.css","erlang-dark.css","lesser-dark.css","mbo.css","mdn-like.css","midnight.css","monokai.css","neat.css","neo.css","night.css","paraiso-dark.css","paraiso-light.css","pastel-on-dark.css","rubyblue.css","solarized.css","the-matrix.css","tomorrow-night-bright.css","tomorrow-night-eighties.css","twilight.css","vibrant-ink.css","xq-dark.css","xq-light.css","zenburn.css"])});
        this.fields["theme"].addEventListener("change", function (event) {
            var theme = (event.target.value !== "") ? event.target.value : null;
            _this.projectClient.socket.emit("edit:resources", "fTextSettings", "setProperty", "theme", theme, function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("fTextSettings", this);
    }
    return fTextSettingsEditor;
})();
exports.default = fTextSettingsEditor;

}).call(this,require('_process'))
},{"_process":2}]},{},[1]);
