
/*export function createOuterAsset(player: SupRuntime.Player, asset: any) {
  // asset is the pub, the asset's properties
  console.log("create outer asset");
  return new window.Sup.Text(asset);
};*/

export function loadAsset(player: SupRuntime.Player, entry: any, callback: (err: Error, asset?: any) => any) {
  player.getAssetData("assets/"+entry.id+"/text.txt", "text", (err: Error, text: string) => {
    if (err) throw err;

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
