(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fTextSettingsResource = require("./fTextSettingsResource");
var fTextAsset = require("./fTextAsset");

SupCore.data.registerResource("fTextSettings", fTextSettingsResource.default);
SupCore.data.registerAssetClass("ftext", fTextAsset.default);

},{"./fTextAsset":4,"./fTextSettingsResource":5}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
///<reference path="./operational-transform.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OT = require("operational-transform");

var path = require("path");
var ScriptAsset = (function (_super) {
    __extends(ScriptAsset, _super);
    // called from the editor onAssetReceived() as well as on server startup
    function ScriptAsset(id, pub, serverData) {
        this.document = new OT.Document();
        _super.call(this, id, pub, ScriptAsset.schema, serverData);
    }
    // called on asset creation
    // options contain the asset's name
    ScriptAsset.prototype.init = function (options, callback) {
        var _this = this;
        var defaultContent = "";
        this.pub = {
            text: defaultContent,
            draft: defaultContent,
            revisionId: 0,
            editorSettings: { defaultSettingsObject: true },
        };
        // the name of the ressource here "fTextSettings" must be the one set in registerResource() in index.ts
        this.serverData.resources.acquire("fTextSettings", null, function (err, fTextSettings) {
            // add the editor settings to all asset instance so that they can be retrieved from the editor
            if (fTextSettings.pub != null)
                _this.pub.editorSettings = fTextSettings.pub;
            _this.serverData.resources.release("fTextSettings", null);
            _super.prototype.init.call(_this, options, callback);
        });
    };
    ScriptAsset.prototype.setup = function () {
        this.document.text = this.pub.draft;
        for (var i = 0; i < this.pub.revisionId; i++)
            this.document.operations.push(0);
        this.hasDraft = this.pub.text !== this.pub.draft;
    };
    ScriptAsset.prototype.restore = function () {
        if (this.hasDraft)
            this.emit("setDiagnostic", "draft", "info");
    };
    ScriptAsset.prototype.destroy = function (callback) {
        /*this.serverData.resources.acquire("fTextSettings", null, (err: Error, fTextSettings: fTextSettingsResource) => {
          // nothing to do here
          this.serverData.resources.release("fTextSettings", null);
          callback();
        });*/
        // just call callback if there is nothing to do with the ressource
        callback();
    };
    // called on server startup
    ScriptAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
            _this.pub = JSON.parse(json);
            fs.readFile(path.join(assetPath, "text.txt"), { encoding: "utf8" }, function (err, text) {
                _this.pub.text = text;
                fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, function (err, draft) {
                    // Temporary asset migration (from tyescript plugin)
                    if (draft == null)
                        draft = _this.pub.text;
                    _this.pub.draft = draft;
                    _this.setup();
                    _this.emit("load");
                });
            });
        });
    };
    ScriptAsset.prototype.save = function (assetPath, callback) {
        var text = this.pub.text;
        delete this.pub.text;
        var draft = this.pub.draft;
        delete this.pub.draft;
        var editorSettings = this.pub.editorSettings;
        delete this.pub.editorSettings;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.text = text;
        this.pub.draft = draft;
        this.pub.editorSettings = editorSettings;
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            fs.writeFile(path.join(assetPath, "text.txt"), text, { encoding: "utf8" }, function (err) {
                if (err != null) {
                    callback(err);
                    return;
                }
                fs.writeFile(path.join(assetPath, "draft.txt"), draft, { encoding: "utf8" }, callback);
            });
        });
    };
    ScriptAsset.prototype.server_editText = function (client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        var operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.document.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
        callback(null, operation.serialize(), this.document.operations.length - 1);
        if (!this.hasDraft) {
            this.hasDraft = true;
            this.emit("setDiagnostic", "draft", "info");
        }
        this.emit("change");
    };
    ScriptAsset.prototype.client_editText = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.document.apply(operation, revisionIndex);
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
    };
    ScriptAsset.prototype.server_saveText = function (client, callback) {
        this.pub.text = this.pub.draft;
        callback(null);
        if (this.hasDraft) {
            this.hasDraft = false;
            this.emit("clearDiagnostic", "draft");
        }
        this.emit("change");
    };
    ScriptAsset.prototype.client_saveText = function () { this.pub.text = this.pub.draft; };
    ScriptAsset.schema = {
        text: { type: "string" },
        draft: { type: "string" },
        revisionId: { type: "integer" },
        editorSettings: { type: "hash" }
    };
    return ScriptAsset;
})(SupCore.data.base.Asset);
exports.default = ScriptAsset;

},{"operational-transform":9,"path":2}],5:[function(require,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fTextSettingsResource = (function (_super) {
    __extends(fTextSettingsResource, _super);
    function fTextSettingsResource(pub, serverData) {
        _super.call(this, pub, fTextSettingsResource.schema, serverData);
    }
    fTextSettingsResource.prototype.init = function (callback) {
        // default values
        this.pub = {
            theme: "monokai"
        };
        _super.prototype.init.call(this, callback);
    };
    fTextSettingsResource.schema = {
        theme: { type: "string?", mutable: true },
    };
    return fTextSettingsResource;
})(SupCore.data.base.Resource);
exports.default = fTextSettingsResource;

},{}],6:[function(require,module,exports){
var OT = require("./index");
var Document = (function () {
    function Document() {
        this.text = "";
        this.operations = [];
    }
    Document.prototype.apply = function (newOperation, revision) {
        // Should't happen
        if (revision > this.operations.length)
            throw new Error("The operation base revision is greater than the document revision");
        if (revision < this.operations.length) {
            // Conflict!
            var missedOperations = new OT.TextOperation(this.operations[revision].userId);
            missedOperations.targetLength = this.operations[revision].baseLength;
            for (var index = revision; index < this.operations.length; index++)
                missedOperations = missedOperations.compose(this.operations[index]);
            newOperation = missedOperations.transform(newOperation)[1];
        }
        this.text = newOperation.apply(this.text);
        this.operations.push(newOperation.clone());
        return newOperation;
    };
    return Document;
})();
module.exports = Document;

},{"./index":9}],7:[function(require,module,exports){
var TextOp = (function () {
    function TextOp(type, attributes) {
        this.type = type;
        this.attributes = attributes;
    }
    return TextOp;
})();
module.exports = TextOp;

},{}],8:[function(require,module,exports){
var OT = require("./index");
var TextOperation = (function () {
    function TextOperation(userId) {
        this.ops = [];
        // An operation's baseLength is the length of every string the operation
        // can be applied to.
        this.baseLength = 0;
        // The targetLength is the length of every string that results from applying
        // the operation on a valid input string.
        this.targetLength = 0;
        this.userId = userId;
    }
    TextOperation.prototype.serialize = function () {
        var ops = [];
        for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            ops.push({ type: op.type, attributes: op.attributes });
        }
        return { ops: ops, userId: this.userId };
    };
    TextOperation.prototype.deserialize = function (data) {
        if (data == null)
            return false;
        this.userId = data.userId;
        for (var _i = 0, _a = data.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op.type) {
                case "retain":
                    this.retain(op.attributes.amount);
                    break;
                case "insert":
                    this.insert(op.attributes.text);
                    break;
                case "delete":
                    this.delete(op.attributes.text);
                    break;
                default: return false;
            }
        }
        return true;
    };
    TextOperation.prototype.retain = function (amount) {
        if (typeof (amount) !== "number" || amount <= 0)
            return;
        this.baseLength += amount;
        this.targetLength += amount;
        var prevOp = this.ops[this.ops.length - 1];
        if (prevOp != null && prevOp.type === "retain") {
            prevOp.attributes.amount += amount;
        }
        else {
            this.ops.push(new OT.TextOp("retain", { amount: amount }));
        }
    };
    TextOperation.prototype.insert = function (text) {
        if (typeof (text) !== "string" || text === "")
            return;
        this.targetLength += text.length;
        var prevOp = this.ops[this.ops.length - 1];
        if (prevOp != null && prevOp.type === "insert") {
            prevOp.attributes.text += text;
        }
        else {
            this.ops.push(new OT.TextOp("insert", { text: text }));
        }
    };
    TextOperation.prototype.delete = function (text) {
        if (typeof (text) !== "string" || text === "")
            return;
        this.baseLength += text.length;
        var prevOp = this.ops[this.ops.length - 1];
        if (prevOp != null && prevOp.type === "delete") {
            prevOp.attributes.text += text;
        }
        else {
            this.ops.push(new OT.TextOp("delete", { text: text }));
        }
    };
    TextOperation.prototype.apply = function (text) {
        if (text.length !== this.baseLength)
            throw new Error("The operation's base length must be equal to the string's length.");
        var index = 0;
        for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op.type) {
                case "retain":
                    index += op.attributes.amount;
                    break;
                case "insert":
                    text = text.substring(0, index) + op.attributes.text + text.substring(index, text.length);
                    index += op.attributes.text.length;
                    break;
                case "delete":
                    text = text.substring(0, index) + text.substring(index + op.attributes.text.length, text.length);
                    break;
            }
        }
        return text;
    };
    TextOperation.prototype.invert = function () {
        var invertedOperation = new TextOperation(this.userId);
        for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op.type) {
                case "retain":
                    invertedOperation.retain(op.attributes.amount);
                    break;
                case "insert":
                    invertedOperation.delete(op.attributes.text);
                    break;
                case "delete":
                    invertedOperation.insert(op.attributes.text);
                    break;
            }
        }
        return invertedOperation;
    };
    TextOperation.prototype.clone = function () {
        var operation = new TextOperation(this.userId);
        for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op.type) {
                case "retain":
                    operation.retain(op.attributes.amount);
                    break;
                case "insert":
                    operation.insert(op.attributes.text);
                    break;
                case "delete":
                    operation.delete(op.attributes.text);
                    break;
            }
        }
        return operation;
    };
    TextOperation.prototype.equal = function (otherOperation) {
        // if (otherOperation.insertedLength !== this.insertedLength) return false;
        if (otherOperation.ops.length !== this.ops.length)
            return false;
        for (var opIndex = 0; opIndex < this.ops.length; opIndex++) {
            var op = this.ops[opIndex];
            var otherOp = otherOperation.ops[opIndex];
            if (otherOp.type !== op.type)
                return false;
            for (var key in op.attributes) {
                var attribute = op.attributes[key];
                if (attribute !== otherOp.attributes[key])
                    return false;
            }
        }
        return true;
    };
    /*
    Largely inspired from Firepad
    Compose merges two consecutive operations into one operation, that
    preserves the changes of both. Or, in other words, for each input string S
    and a pair of consecutive operations A and B,
    apply(apply(S, A), B) = apply(S, compose(A, B)) must hold.
    */
    TextOperation.prototype.compose = function (operation2) {
        if (this.targetLength !== operation2.baseLength)
            throw new Error("The base length of the second operation has to be the target length of the first operation");
        // the combined operation
        var composedOperation = new TextOperation(this.userId);
        var ops1 = this.clone().ops;
        var ops2 = operation2.clone().ops;
        var i1 = 0; // current index into ops1 respectively ops2
        var i2 = 0;
        var op1 = ops1[i1++]; // current ops
        var op2 = ops2[i2++];
        while (true) {
            // Dispatch on the type of op1 and op2
            // end condition: both ops1 and ops2 have been processed
            if (op1 == null && op2 == null)
                break;
            if (op2 == null) {
                switch (op1.type) {
                    case "retain":
                        composedOperation.retain(op1.attributes.amount);
                        break;
                    case "insert":
                        composedOperation.insert(op1.attributes.text);
                        break;
                    case "delete":
                        composedOperation.delete(op1.attributes.text);
                        break;
                }
                op1 = ops1[i1++];
                continue;
            }
            if (op1 == null) {
                switch (op2.type) {
                    case "retain":
                        composedOperation.retain(op2.attributes.amount);
                        break;
                    case "insert":
                        composedOperation.insert(op2.attributes.text);
                        break;
                    case "delete":
                        composedOperation.delete(op2.attributes.text);
                        break;
                }
                op2 = ops2[i2++];
                continue;
            }
            if (op1 != null && op1.type === "delete") {
                composedOperation.delete(op1.attributes.text);
                op1 = ops1[i1++];
                continue;
            }
            if (op2 != null && op2.type === "insert") {
                composedOperation.insert(op2.attributes.text);
                op2 = ops2[i2++];
                continue;
            }
            if (op1 == null)
                throw new Error("Cannot transform operations: first operation is too short.");
            if (op2 == null)
                throw new Error("Cannot transform operations: first operation is too long.");
            if (op1.type === "retain" && op2.type === "retain") {
                if (op1.attributes.amount === op2.attributes.amount) {
                    composedOperation.retain(op1.attributes.amount);
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.amount > op2.attributes.amount) {
                    composedOperation.retain(op2.attributes.amount);
                    op1.attributes.amount -= op2.attributes.amount;
                    op2 = ops2[i2++];
                }
                else {
                    composedOperation.retain(op1.attributes.amount);
                    op2.attributes.amount -= op1.attributes.amount;
                    op1 = ops1[i1++];
                }
            }
            else if (op1.type === "insert" && op2.type === "delete") {
                if (op1.attributes.text.length === op2.attributes.text) {
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.text.length > op2.attributes.text.length) {
                    op1.attributes.text = op1.attributes.text.slice(op2.attributes.text.length);
                    op2 = ops2[i2++];
                }
                else {
                    op2.attributes.text = op2.attributes.text.slice(op1.attributes.text.length);
                    op1 = ops1[i1++];
                }
            }
            else if (op1.type === "insert" && op2.type === "retain") {
                if (op1.attributes.text.length > op2.attributes.amount) {
                    composedOperation.insert(op1.attributes.text.slice(0, op2.attributes.amount));
                    op1.attributes.text = op1.attributes.text.slice(op2.attributes.amount);
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.text.length === op2.attributes.amount) {
                    composedOperation.insert(op1.attributes.text);
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else {
                    composedOperation.insert(op1.attributes.text);
                    op2.attributes.amount -= op1.attributes.text.length;
                    op1 = ops1[i1++];
                }
            }
            else if (op1.type === "retain" && op2.type === "delete") {
                if (op1.attributes.amount === op2.attributes.text.length) {
                    composedOperation.delete(op2.attributes.text);
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.amount > op2.attributes.text.length) {
                    composedOperation.delete(op2.attributes.text);
                    op1.attributes.amount -= op2.attributes.text.length;
                    op2 = ops2[i2++];
                }
                else {
                    composedOperation.delete(op2.attributes.text.slice(0, op1.attributes.amount));
                    op2.attributes.text = op2.attributes.text.slice(op1.attributes.amount);
                    op1 = ops1[i1++];
                }
            }
            else {
                throw new Error("This shouldn't happen: op1: " + JSON.stringify(op1) + ", op2: " + JSON.stringify(op2));
            }
        }
        return composedOperation;
    };
    /*
    Largely inspired from Firepad
    Transform takes two operations A (this) and B (other) that happened concurrently and
    produces two operations A' and B' (in an array) such that
    `apply(apply(S, A), B') = apply(apply(S, B), A')`.
    This function is the heart of OT.
    */
    TextOperation.prototype.transform = function (operation2) {
        var operation1prime, operation2prime;
        var ops1, ops2;
        // Give priority with the user id
        if (this.gotPriority(operation2.userId)) {
            operation1prime = new TextOperation(this.userId);
            operation2prime = new TextOperation(operation2.userId);
            ops1 = this.clone().ops;
            ops2 = operation2.clone().ops;
        }
        else {
            operation1prime = new TextOperation(operation2.userId);
            operation2prime = new TextOperation(this.userId);
            ops1 = operation2.clone().ops;
            ops2 = this.clone().ops;
        }
        var i1 = 0;
        var i2 = 0;
        var op1 = ops1[i1++];
        var op2 = ops2[i2++];
        while (true) {
            // At every iteration of the loop, the imaginary cursor that both
            // operation1 and operation2 have that operates on the input string must
            // have the same position in the input string.
            // end condition: both ops1 and ops2 have been processed
            if (op1 == null && op2 == null)
                break;
            // next two cases: one or both ops are insert ops
            // => insert the string in the corresponding prime operation, skip it in
            // the other one. If both op1 and op2 are insert ops, prefer op1.
            if (op1 != null && op1.type === "insert") {
                operation1prime.insert(op1.attributes.text);
                operation2prime.retain(op1.attributes.text.length);
                op1 = ops1[i1++];
                continue;
            }
            if (op2 != null && op2.type === "insert") {
                operation1prime.retain(op2.attributes.text.length);
                operation2prime.insert(op2.attributes.text);
                op2 = ops2[i2++];
                continue;
            }
            if (op1 == null)
                throw new Error("Cannot transform operations: first operation is too short.");
            if (op2 == null)
                throw new Error("Cannot transform operations: first operation is too long.");
            if (op1.type === "retain" && op2.type === "retain") {
                // Simple case: retain/retain
                var minl = void 0;
                if (op1.attributes.amount === op2.attributes.amount) {
                    minl = op2.attributes.amount;
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.amount > op2.attributes.amount) {
                    minl = op2.attributes.amount;
                    op1.attributes.amount -= op2.attributes.amount;
                    op2 = ops2[i2++];
                }
                else {
                    minl = op1.attributes.amount;
                    op2.attributes.amount -= op1.attributes.amount;
                    op1 = ops1[i1++];
                }
                operation1prime.retain(minl);
                operation2prime.retain(minl);
            }
            else if (op1.type === "delete" && op2.type === "delete") {
                // Both operations delete the same string at the same position. We don't
                // need to produce any operations, we just skip over the delete ops and
                // handle the case that one operation deletes more than the other.
                if (op1.attributes.text.length === op2.attributes.text.length) {
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.text.length > op2.attributes.text.length) {
                    op1.attributes.text = op1.attributes.text.slice(op2.attributes.text.length);
                    op2 = ops2[i2++];
                }
                else {
                    op2.attributes.text = op1.attributes.text.slice(op1.attributes.text.length);
                    op1 = ops1[i1++];
                }
            }
            else if (op1.type === "delete" && op2.type === "retain") {
                var text = void 0;
                if (op1.attributes.text.length === op2.attributes.amount) {
                    text = op1.attributes.text;
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.text.length > op2.attributes.amount) {
                    text = op1.attributes.text.slice(0, op2.attributes.amount);
                    op1.attributes.text = op1.attributes.text.slice(op2.attributes.amount);
                    op2 = ops2[i2++];
                }
                else {
                    text = op1.attributes.text;
                    op2.attributes.amount -= op1.attributes.text.length;
                    op1 = ops1[i1++];
                }
                operation1prime.delete(text);
            }
            else if (op1.type === "retain" && op2.type === "delete") {
                var text = void 0;
                if (op1.attributes.amount === op2.attributes.text.length) {
                    text = op2.attributes.text;
                    op1 = ops1[i1++];
                    op2 = ops2[i2++];
                }
                else if (op1.attributes.amount > op2.attributes.text.length) {
                    text = op2.attributes.text;
                    op1.attributes.amount -= op2.attributes.text.length;
                    op2 = ops2[i2++];
                }
                else {
                    text = op2.attributes.text.slice(0, op1.attributes.amount);
                    op2.attributes.text = op2.attributes.text.slice(op1.attributes.amount);
                    op1 = ops1[i1++];
                }
                operation2prime.delete(text);
            }
            else {
                throw new Error("The two operations aren't compatible");
            }
        }
        if (this.gotPriority(operation2.userId))
            return [operation1prime, operation2prime];
        else
            return [operation2prime, operation1prime];
    };
    TextOperation.prototype.gotPriority = function (id2) { return (this.userId <= id2); };
    return TextOperation;
})();
module.exports = TextOperation;

},{"./index":9}],9:[function(require,module,exports){
var TextOp = require("./TextOp");
exports.TextOp = TextOp;
var Document = require("./Document");
exports.Document = Document;
var TextOperation = require("./TextOperation");
exports.TextOperation = TextOperation;

},{"./Document":6,"./TextOp":7,"./TextOperation":8}]},{},[1]);
