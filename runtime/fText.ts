
import * as jsonlint from "jsonlint";
import * as CSON from "cson-parser";
import * as domify from "domify";
import * as markdown from "markdown";
import * as jade from "jade";
import * as stylus from "stylus";

(<any>window).fTextParsers = {
  jsonlint: jsonlint,
  CSON: CSON,
  domify: domify,
  markdown: markdown.markdown,
  jade: jade,
  stylus: stylus,
};

export function createOuterAsset(player: SupRuntime.Player, asset: any) {
  // asset is the pub, the asset's properties
  // console.log("createOuterAsset", asset);
  return new (<any>window).fText(asset);
}

export function init(player: any, callback: Function) {
  callback();
}

export function start(player: any, callback: Function) {
  callback();
}

export function loadAsset(player: SupRuntime.Player, entry: any, callback: (err: Error, asset?: any) => any) {
  /*
  entry has the Asset interface
  interface Asset {
    id: string;
    name: string;
    type: string;
    children?: any[];
  }
  */
  player.getAssetData("assets/"+entry.id+"/text.txt", "text", (err: Error, text: string) => {
    if (err) throw err;

    // in case the content is valid JSON, text is a JS object instead of a string
    if (text === Object(text))
      text = JSON.stringify(text);
    
    entry.text = text;
    callback(null, entry);
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
