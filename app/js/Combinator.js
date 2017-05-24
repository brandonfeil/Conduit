"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var OperandType_1 = require("./interfaces/OperandType");
//module Combinators {
var Combinator = (function () {
    function Combinator() {
        this.inputs = [];
        this.output = {};
        this.outputOne = false;
        this._comparisonOutputs = {};
        this.operator = function (l, r) { return false; };
        this.operands = {
            left: {
                type: OperandType_1.OperandType.Signal,
                name: ""
            },
            right: {
                type: OperandType_1.OperandType.Signal,
                name: ""
            },
            output: {
                type: OperandType_1.OperandType.Signal,
                name: ""
            },
        };
    }
    Object.defineProperty(Combinator.prototype, "_mergedInputs", {
        get: function () {
            var inputCollections = [];
            for (var _i = 0, _a = this.inputs; _i < _a.length; _i++) {
                var input = _a[_i];
                inputCollections.push(input.value);
            }
            // get merged properties
            var result = Object.assign.apply(Object, [{}].concat(inputCollections));
            // then zero out the merged list so we can ADD the original inputs together
            for (var key in result) {
                result[key] = 0;
            }
            // loop through each input Signals and add its values to the rest
            for (var _b = 0, inputCollections_1 = inputCollections; _b < inputCollections_1.length; _b++) {
                var input = inputCollections_1[_b];
                for (var key in input) {
                    result[key] += input[key];
                }
            }
            // in Factorio, a signal ceases to exist if its value is 0
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
    Object.defineProperty(Combinator.prototype, "_filteredOutputs", {
        get: function () {
            // if there is no output operand, return an empty object
            if (Object.keys(this.operands.output).length === 0) {
                return {};
            }
            if (this.operands.output.type === OperandType_1.OperandType.Signal) {
                if (this.outputOne) {
                    var returnObj = {};
                    if (Object.keys(this._comparisonOutputs).length > 0) {
                        returnObj[this.operands.output.name] = 1;
                    }
                    return returnObj;
                }
                else {
                    var returnObj = {};
                    if (this._comparisonOutputs.hasOwnProperty(this.operands.output.name)) {
                        returnObj[this.operands.output.name] = this._comparisonOutputs[this.operands.output.name];
                    }
                    return returnObj;
                }
            }
            else if (this.operands.output.type === OperandType_1.OperandType.Every || this.operands.output.type === OperandType_1.OperandType.Each) {
                var returnObj = this._comparisonOutputs;
                if (this.outputOne) {
                    for (var key in returnObj) {
                        returnObj[key] = 1;
                    }
                }
                return returnObj;
            }
        },
        enumerable: true,
        configurable: true
    });
    return Combinator;
}());
var DeciderOperators = {
    lt: function (L, R) {
        return (L < R);
    },
    gt: function (L, R) {
        return (L > R);
    },
    lte: function (L, R) {
        return (L <= R);
    },
    gte: function (L, R) {
        return (L >= R);
    },
    eq: function (L, R) {
        return (L === R);
    },
    neq: function (L, R) {
        return (L !== R);
    }
};
var DeciderCombinator = (function (_super) {
    __extends(DeciderCombinator, _super);
    function DeciderCombinator() {
        return _super.call(this) || this;
    }
    DeciderCombinator.prototype.tick = function () {
        this._calculate();
    };
    DeciderCombinator.prototype.tock = function () {
        this.output = this._filteredOutputs;
    };
    DeciderCombinator.prototype._calculate = function () {
        var matches = {};
        // return an empty object if any operands are missing
        if (Object.keys(this.operands.left).length === 0 ||
            Object.keys(this.operands.right).length === 0 ||
            Object.keys(this.operands.output).length === 0) {
            this._comparisonOutputs = {};
            return;
        }
        // throw an error if the output types are wrong
        if (this.operands.output.type === OperandType_1.OperandType.Each && this.operands.left.type !== OperandType_1.OperandType.Each) {
            throw ("DeciderCombinator: Each is only a valid output if it is also the left-hand operator");
        }
        // establish rightHand value
        var rightHandValue = 0;
        if (this.operands.right.type === OperandType_1.OperandType.Constant) {
            rightHandValue = this.operands.right.value ? this.operands.right.value : 0;
        }
        else if (this.operands.right.type === OperandType_1.OperandType.Signal) {
            rightHandValue = this._mergedInputs.hasOwnProperty(this.operands.right.name) ? this._mergedInputs[this.operands.right.name] : 0;
        }
        else {
            throw ("DeciderCombinator: Virtual signals cannot be right-hand operators");
        }
        // calculate based on left hand type
        // Signal (Only one comparison)
        if (this.operands.left.type === OperandType_1.OperandType.Signal) {
            var leftHandValue = this._mergedInputs.hasOwnProperty(this.operands.left.name) ? this._mergedInputs[this.operands.left.name] : 0;
            this._comparisonOutputs = this.operator(leftHandValue, rightHandValue) ? this._mergedInputs : {};
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Any) {
            for (var signal in this._mergedInputs) {
                var leftHandValue = this._mergedInputs[signal];
                if (this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = this._mergedInputs;
                    return;
                }
            }
            this._comparisonOutputs = {};
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Every) {
            for (var signal in this._mergedInputs) {
                var leftHandValue = this._mergedInputs[signal];
                if (!this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = {};
                    return;
                }
            }
            this._comparisonOutputs = this._mergedInputs;
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Each) {
            var matches_1 = {};
            for (var signal in this._mergedInputs) {
                var leftHandValue = this._mergedInputs[signal];
                if (this.operator(leftHandValue, rightHandValue)) {
                    matches_1[signal] = leftHandValue;
                }
            }
            if (this.operands.output.type === OperandType_1.OperandType.Each) {
                this._comparisonOutputs = matches_1;
                return;
            }
            else if (this.operands.output.type === OperandType_1.OperandType.Signal) {
                var signalValue = {};
                signalValue[this.operands.output.name] = 0;
                for (var key in matches_1) {
                    signalValue[this.operands.output.name] += matches_1[key];
                }
                this._comparisonOutputs = signalValue;
                return;
            }
            else {
                throw ("DeciderCombinator: Invalid output type with input type 'Each'");
            }
        }
        else {
            throw ("DeciderCombinator: Invalid left-hand type");
        }
    };
    return DeciderCombinator;
}(Combinator));
DeciderCombinator.Operators = DeciderOperators;
exports.DeciderCombinator = DeciderCombinator;
//# sourceMappingURL=Combinator.js.map