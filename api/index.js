var fs = require("fs");

SupAPI.registerPlugin("typescript", "fText", {
  code: fs.readFileSync(__dirname+"/fText.ts", { encoding: "utf8" }).replace("<reference path=", ""),
  defs: fs.readFileSync(__dirname+"/fText.d.ts", { encoding: "utf8" }),
});
