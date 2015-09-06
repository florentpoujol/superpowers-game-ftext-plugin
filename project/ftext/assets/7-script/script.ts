console.log("script loaded");

let text = Sup.get("main.jade",fText);
console.log(text.text);
console.log(text.parse());

console.log(fText.parsers.domify(text.parse()));

console.log(Sup.get("afolder/include.jade",fText).text);
console.log(Sup.get("afolder/include.jade",fText).parse());

let styl = Sup.get("style.styl", fText);
console.log(styl.parse());
// (err: Error, css:string) => {
//   console.log("stylus 2");
//   console.log(css);
// }
// console.log("stylus 3", fText.parsers.stylus(styl.text).set("imports", []).render());
