/// <reference path="Sup.d.ts"/>

module fText {
  export function parseInstructions(text: string) {
    let instructions: any = {};
    let regex = /@ftextasset\s*:\s*([a-zA-Z0-9\/+-]+)(\s*:\s*([a-zA-Z0-9\.\/+-]+))?/ig
    let match: any;
    let i = 0; // prevent infinite loop

    do {
      match = regex.exec(text);
      if (match != null && match[1] != undefined) {
        let name = match[1].trim().toLowerCase();
        let value = match[3];
        if (value !== undefined) value = value.trim();
        else value = "";
        if (name === "include") {
          if (instructions[name] === undefined) instructions[name] = [];
          instructions[name].push(value);
        }
        else
          instructions[name] = value;
      }
      i++;
    }
    while (match != null && i < 9999);

    return instructions;
  }

  export class fText extends Sup.Asset {

    get text(): string {
      let text = this.__inner;
      let instructions = parseInstructions(text);

      if (instructions["include"] != null) {
        for (let path of instructions["include"]) {
          console.log("fTextAsset.text path", path);
          let asset = Sup.get(path, {ignoreMissing: false}, fText); 
          // note: for some reason, the three arguments are needed here
          let re = new RegExp("[^\\s]*@ftextasset\\s*:\\s*include\\s*:\\s*"+path.replace(".", "\\.")+"", "i");
          text = text.replace(re, asset.text);
        }
      }
      return text;
    }
  }
}

(<any>window).fText = fText;
