(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fText = require("./fText");
SupRuntime.registerPlugin("fText", fText);

},{"./fText":2}],2:[function(require,module,exports){
/*export function createOuterAsset(player: SupRuntime.Player, asset: any) {
  // asset is the pub, the asset's properties
  console.log("create outer asset");
  return new window.Sup.Text(asset);
};*/
function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.id + "/text.txt", "text", function (err, text) {
        if (err)
            throw err;
        // in case the content is valid JSON, text is a JS object instead of a string
        if (text === Object(text))
            text = JSON.stringify(text);
        callback(null, text);
        /*
        var result = /codemirror-mode\s*:\s*(css|less)/gi.exec(text);
        if (result !== null && result[1] !== undefined) {
          
          var load = /loadStyleAtRuntime:\s*true/gi.exec(text);
          if (load !== null) {
    
            var style = window.document.createElement("style");
            window.document.head.appendChild(style);
            style.type = "text/css";
    
            var mode = result[1];
            if (mode === "css")
              style.innerHTML = text;
            else if (mode === "less") {
              // window.textAssetParsers is defined in api/index.js
              window.textAssetParsers.less.render(text, {}, function(err, output) {
                if (err) throw err;
                else
                  style.innerHTML = output.css;
              });
            }
          }
        }*/
    });
}
exports.loadAsset = loadAsset;

},{}]},{},[1]);
