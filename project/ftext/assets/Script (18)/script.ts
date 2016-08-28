Sup.log("script loaded");

let text = Sup.get("main.jade",fText);

Sup.log(text.getText());

let parsed = text.parse();
Sup.log(parsed);

Sup.log("----------------------");

Sup.log((Sup.get("yaml.yml") as fText).parse());

// Sup.log(fText.parsers.domify(parsed));
/*
Sup.log(Sup.get("afolder/include.jade",fText).text);
Sup.log(Sup.get("afolder/include.jade",fText).parse());

let styl = Sup.get("style.styl", fText);
Sup.log(styl.parse());
// (err: Error, css:string) => {
//   Sup.log("stylus 2");
//   Sup.log(css);
// }
// Sup.log("stylus 3", fText.parsers.stylus(styl.text).set("imports", []).render());
*/

