import ui, { refreshErrors } from "./ui";

import * as jsonlint from "jsonlint";
import * as cson from "cson-parser";
import * as jade from "jade";
import * as stylus from "stylus";

export function compile(data: any) {
  let errors = new Array<any>();
  let syntax: string = data.assetInstructions["syntax"];
  let compilableSyntaxes: any = ["json", "cson", "jade", "styl"];
  let text = ui.editor.codeMirrorInstance.getDoc().getValue();

  if (syntax != null && compilableSyntaxes.indexOf(syntax) !== -1) {
    try {
      switch(syntax) {
        case "json": 
          (<any>jsonlint).parse(text);
          break;
        case "cson": 
          (<any>cson).parse(text);
          break;
        case "jade": 
          (<any>jade).compile(text);
          break;
      }
    }
    catch (e) {
      console.log("Error compiling fText asset:", (<Object>e));
      console.error(e);
      let line = -1;
      let character = -1;
      let errorLength: number;
      let result: string[];
      let msg: string;

      switch(syntax) {
        case "json": 
          // first line of the message:
          // "Error: Parse error on line X:"
          result = /line ([0-9]+)/.exec(e.message);
          if (result != null)
            line = parseInt(result[1]);
          errors.push({
            message: e.message,
            position: { line }
          });
          break;
       
        case "cson": 
          msg = e.toString();
          // get line and char
          result = /\[stdin\]:([0-9]+):([0-9]+): error:/.exec(msg);
          if (result != null) {
            line = parseInt(result[1]);
            character = parseInt(result[2]);
            msg = msg.replace(result[0], "");
          }
          // get error length
          result = /([\^]+)/.exec(msg);
          if (result != null) {
            errorLength = result[1].length;
            msg = msg.replace(result[1], "");
          }
          errors.push({
            message: msg,
            position: { line, character },
            length: errorLength
          });
          break;
        
        case "jade":
          msg = e.message;
          // get line and char
          result = /Jade:([0-9]+)/.exec(msg);
          if (result != null) {
            line = parseInt(result[1]);
            msg = msg.replace(result[0], "");
          }
          errors.push({
            message: msg,
            position: { line}
          });
          break;
      }
    }
  }

  refreshErrors(errors);
}
