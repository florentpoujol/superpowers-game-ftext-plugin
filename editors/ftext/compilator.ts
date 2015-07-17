import ui, { refreshErrors } from "./ui";

import * as jsonlint from "jsonlint";
import * as csonparser from "cson-parser";
import * as jade from "jade";
import * as stylus from "stylus";

export function compile(data: any) {
  let errors = new Array<any>();
  let syntax: string = data.assetInstructions["syntax"];
  
  if (syntax != null && ui.compilableSyntaxes.indexOf(syntax) !== -1) {
    let text = ui.editor.codeMirrorInstance.getDoc().getValue();
    try {
      switch(syntax) {
        case "json": 
          (<any>jsonlint).parse(text);
          break;
        case "cson": 
          (<any>csonparser).parse(text);
          break;
        case "jade": 
          (<any>jade).compile(text);
          break;
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
          // get line
          result = /Jade:([0-9]+)/.exec(msg);
          if (result != null)
            line = parseInt(result[1]);
          // keep the before-the-last line, with the actual error msg
          lines = msg.split("\n");
          if (lines.length >= 2)
            msg = lines[lines.length-2]; 
          errors.push({
            message: msg,
            position: { line }
          });
          break;

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
