import ui, { refreshErrors } from "./ui";

import * as jsonlint from "jsonlint";
import * as CSON from "cson-parser";
import * as jade from "jade";
import * as stylus from "stylus";

export function compile(data: any) {
  console.log("compile");

  let errors = new Array<any>();

  let syntax: string = data.instructions["syntax"];
  let compilableSyntaxes: any = ["json", "cson", "jade", "styl"];
  let text = ui.editor.codeMirrorInstance.getDoc().getValue();

  if (syntax != null && compilableSyntaxes.indexOf(syntax) !== -1) {
    try {
      switch(syntax) {
        case "json": 
          (<any>jsonlint).parse(text);
          break;
        case "cson": 
          (<any>CSON).parse(text);
          break;
        case "jade": 
          (<any>jade).compile(text);
          break;
      }
    }
    catch (e) {
      console.log("error copiling asset");
      console.error(e);
    }
  }

  refreshErrors(errors);
}
