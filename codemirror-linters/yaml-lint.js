// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on js-yaml https://github.com/nodeca/js-yaml

// declare global: jsyaml

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerHelper("lint", "yaml", function(text) {
  var found = [];
  try {
    jsyaml.safeLoad(text);
  } catch(e) { // e is of type YamlException
    var mark = e.mark || {};
    var line = mark.line || -1;
    var column = mark.column || -1;
    found.push({from: CodeMirror.Pos(line, column - 1),
                to: CodeMirror.Pos(line, column + 1),
                severity: 'error',
                message: e.message});
  }
  return found;
});

});
