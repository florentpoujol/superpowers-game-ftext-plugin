console.log("script loaded");

let text = Sup.get("main.jade",fText);
console.log(text.text);

let parsed = text.parse();
console.log(parsed);

console.log("----------------------");

console.log((<fText>Sup.get("yaml.yml")).parse());

// console.log(fText.parsers.domify(parsed));
/*
console.log(Sup.get("afolder/include.jade",fText).text);
console.log(Sup.get("afolder/include.jade",fText).parse());

let styl = Sup.get("style.styl", fText);
console.log(styl.parse());
// (err: Error, css:string) => {
//   console.log("stylus 2");
//   console.log(css);
// }
// console.log("stylus 3", fText.parsers.stylus(styl.text).set("imports", []).render());
*/

