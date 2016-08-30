"use strict";
var jsonlint = require("jsonlint");
var csonparser = require("cson-parser");
var domify = require("domify");
var markdown = require("markdown");
var pug = require("pug");
var stylus = require("stylus");
var jsyaml = require("js-yaml");
window.fTextParsers = {
    jsonlint: jsonlint,
    csonparser: csonparser,
    domify: domify,
    markdown: markdown.markdown,
    pug: pug,
    stylus: stylus,
    jsyaml: jsyaml,
};
function createOuterAsset(player, asset) {
    // asset is the pub, the asset's properties
    return new window.fText(asset);
}
exports.createOuterAsset = createOuterAsset;
function init(player, callback) {
    callback();
}
exports.init = init;
function start(player, callback) {
    callback();
}
exports.start = start;
function loadAsset(player, entry, callback) {
    // entry has the Asset interface
    // app\system\SupRuntime\src\Player.ts:
    player.getAssetData("assets/" + entry.storagePath + "/ftext.txt", "text", function (err, text) {
        if (err)
            throw err;
        // in case the content is valid JSON, text is a JS object instead of a string
        if (text === Object(text))
            text = JSON.stringify(text);
        entry.text = text;
        callback(null, entry);
    });
}
exports.loadAsset = loadAsset;
