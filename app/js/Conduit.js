"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Conduit = (function () {
    function Conduit() {
        this.inputs = [];
    }
    Object.defineProperty(Conduit.prototype, "value", {
        get: function () {
            var result = {}; // Object.assign({}, ...this.inputs);
            // merge all SignalCollections into one
            for (var _i = 0, _a = this.inputs; _i < _a.length; _i++) {
                var input = _a[_i];
                Object.assign(result, input.output);
            }
            // zero out the values
            for (var key in result) {
                result[key] = 0;
            }
            // loop through each input Signals and add its values to the rest
            for (var _b = 0, _c = this.inputs; _b < _c.length; _b++) {
                var input = _c[_b];
                for (var key in input.output) {
                    result[key] += input.output[key];
                }
            }
            // Remove signals with a value of 0
            for (var key in result) {
                if (result[key] === 0) {
                    delete result[key];
                }
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    return Conduit;
}());
exports.Conduit = Conduit;
//# sourceMappingURL=Conduit.js.map