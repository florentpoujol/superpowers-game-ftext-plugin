var querystring = require("querystring");
var qs = querystring.parse(window.location.search.slice(1));
var info = { projectId: qs.project, assetId: qs.asset, line: qs.line, ch: qs.ch };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = info;
