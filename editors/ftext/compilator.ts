import ui, { refreshErrors } from "./ui";

import * as stylus from "stylus";

export function compile(data: any) {
  let errors = new Array<any>();
  let syntax: string = data.assetInstructions["syntax"];
  
  if (syntax != null && ui.compilableSyntaxes.indexOf(syntax) !== -1) {
    let text = ui.editor.codeMirrorInstance.getDoc().getValue();
    try {
      switch(syntax) {
        case "stylus": 
          (<any>stylus)(text).set("imports", []).render();
          break;
      }
    }
    catch (e) {
      console.log("Error compiling fText asset:");
      console.error(e);
      let line = -1;
      let lines: string[];
      let character = -1;
      let errorLength: number;
      let result: string[];
      let msg: string;

      switch(syntax) {       

        case "stylus":
          msg = e.message
          lines = msg.split("\n");
          if (lines.length >= 2)
            msg = lines[lines.length-2]; 
          errors.push({
            message: msg
          });
          break;
      }
    }
  }

  refreshErrors(errors);
}
