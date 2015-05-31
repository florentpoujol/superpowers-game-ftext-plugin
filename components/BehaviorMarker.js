var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BehaviorUpdater_1 = require("./BehaviorUpdater");
var BehaviorMarker = (function (_super) {
    __extends(BehaviorMarker, _super);
    function BehaviorMarker() {
        _super.apply(this, arguments);
    }
    BehaviorMarker.Updater = BehaviorUpdater_1.default;
    return BehaviorMarker;
})(SupEngine.ActorComponent);
exports.default = BehaviorMarker;
