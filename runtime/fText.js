"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonlint = require("jsonlint");
const csonparser = require("cson-parser");
const domify = require("domify");
const markdown = require("markdown");
const pug = require("pug");
const stylus = require("stylus");
const jsyaml = require("js-yaml");
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
    player.getAssetData("assets/" + entry.storagePath + "/ftext.txt", "text", (err, text) => {
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
