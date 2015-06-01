var fs = require("fs");

SupAPI.registerPlugin("typescript", "fText", {
  code: fs.readFileSync(__dirname+"/fText.ts.txt", { encoding: "utf8" }),
  defs: fs.readFileSync(__dirname+"/fText.d.ts.txt", { encoding: "utf8" }),
});
