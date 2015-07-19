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

CodeMirror.registerHelper("lint", "coffeescript", function(text) {
  var found = [];
/*  var parseError = function(err) {
    var loc = err.lineNumber;
    found.push({from: CodeMirror.Pos(loc-1, 0),
                to: CodeMirror.Pos(loc, 0),
                severity: err.level,
                message: err.message});
  };*/
  try {
    csonparser.parse(text);
  } catch(e) {
    var location = e.location || {};
    var line = location.first_line || -1;
    var lastLine = location.last_line || line;
    var lastColumn = location.last_column || -1;
    found.push({from: CodeMirror.Pos(line, 0),
                to: CodeMirror.Pos(lastLine, lastColumn),
                severity: 'error',
                message: e.message});
  }
  return found;
});

});
