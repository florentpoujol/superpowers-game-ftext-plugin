var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Behavior = (function (_super) {
    __extends(Behavior, _super);
    function Behavior(actor, funcs) {
        this.funcs = funcs;
        _super.call(this, actor, "Behavior");
    }
    Behavior.prototype.awake = function () { if (this.funcs.awake != null)
        this.funcs.awake(); };
    Behavior.prototype.start = function () { if (this.funcs.start != null)
        this.funcs.start(); };
    Behavior.prototype.update = function () { if (this.funcs.update != null)
        this.funcs.update(); };
    Behavior.prototype._destroy = function () {
        if (this.funcs.destroy != null)
            this.funcs.destroy();
        this.funcs = null;
        _super.prototype._destroy.call(this);
    };
    return Behavior;
})(SupEngine.ActorComponent);
exports.default = Behavior;
