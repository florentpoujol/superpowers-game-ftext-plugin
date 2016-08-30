// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on csonparser https://github.com/groupon/cson-parser

// declare global: csonparser

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerHelper("lint", "pug", function(text) {
  var found = [];
  try {
    pug.compile(text, {compileDebug: false})();
  } catch(e) {
    console.error(e, pug);
    var msg = e.message;
    // get line
    var result = /Pug:([0-9]+):([0-9]+)/.exec(msg);
    var line = -1;
    var char = -1;
    if (result != null) {
      line = parseInt(result[1], 10);
      char = parseInt(result[2], 10);
    }
    var lines = msg.split("\n");
    if (lines.length >= 2)
      msg = lines[lines.length-1];
    found.push({from: CodeMirror.Pos(line-1, char-1),
                to: CodeMirror.Pos(line-1, char+1),
                severity: 'error',
                message: msg});
    console.log(found);
  }
  return found;
});

});
