
import * as jsonlint from "jsonlint";
import * as csonparser from "cson-parser";
import * as domify from "domify";
import * as markdown from "markdown";
import * as jade from "jade";
import * as stylus from "stylus";
import * as jsyaml from "js-yaml";

(<any>window).fTextParsers = {
  jsonlint: jsonlint,
  csonparser: csonparser,
  domify: domify,
  markdown: markdown.markdown,
  jade: jade,
  stylus: stylus,
  jsyaml: jsyaml,
};

export function createOuterAsset(player: SupRuntime.Player, asset: any) {
  // asset is the pub, the asset's properties
  return new (<any>window).fText(asset);
}

export function init(player: any, callback: Function) {
  callback();
}

export function start(player: any, callback: Function) {
  callback();
}

export function loadAsset(player: SupRuntime.Player, entry: any, callback: (err: Error, asset?: any) => any) {
  // entry has the Asset interface
  // app\system\SupRuntime\src\Player.ts:
  player.getAssetData("assets/"+entry.storagePath+"/ftext.txt", "text", (err: Error, text: string) => {
    if (err) throw err;

    // in case the content is valid JSON, text is a JS object instead of a string
    if (text === Object(text))
      text = JSON.stringify(text);
    
    entry.text = text;
    callback(null, entry);
  });
}
