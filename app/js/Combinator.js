"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OperandType_1 = require("./interfaces/OperandType");
const DeciderOperators = {
    lt: (L, R) => {
        return (L < R);
    },
    gt: (L, R) => {
        return (L > R);
    },
    lte: (L, R) => {
        return (L <= R);
    },
    gte: (L, R) => {
        return (L >= R);
    },
    eq: (L, R) => {
        return (L === R);
    },
    neq: (L, R) => {
        return (L !== R);
    }
};
const MathOperators = {
    add: (L, R) => {
        return Math.trunc();
    }
};
class Combinator {
    /*
    *   Constructor
    */
    constructor() {
        this.inputs = [];
        this.output = {};
        this.outputOne = false;
        this._comparisonOutputs = {};
        this.operator = (l, r) => { return false; };
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
    /*
    *   Getters/Setters
    */
    get _mergedInputs() {
        let inputCollections = [];
        for (let input of this.inputs) {
            inputCollections.push(input.value);
        }
        // get merged properties
        let result = Object.assign({}, ...inputCollections);
        // then zero out the merged list so we can ADD the original inputs together
        for (let key in result) {
            result[key] = 0;
        }
        // loop through each input Signals and add its values to the rest
        for (let input of inputCollections) {
            for (let key in input) {
                result[key] += input[key];
            }
        }
        // in Factorio, a signal ceases to exist if its value is 0
        for (let key in result) {
            if (result[key] === 0) {
                delete result[key];
            }
        }
        return result;
    }
    get _filteredOutputs() {
        // if there is no output operand, return an empty object
        if (Object.keys(this.operands.output).length === 0) {
            return {};
        }
        if (this.operands.output.type === OperandType_1.OperandType.Signal) {
            if (this.outputOne) {
                let returnObj = {};
                if (Object.keys(this._comparisonOutputs).length > 0) {
                    returnObj[this.operands.output.name] = 1;
                }
                return returnObj;
            }
            else {
                let returnObj = {};
                if (this._comparisonOutputs.hasOwnProperty(this.operands.output.name)) {
                    returnObj[this.operands.output.name] = this._comparisonOutputs[this.operands.output.name];
                }
                return returnObj;
            }
        }
        else if (this.operands.output.type === OperandType_1.OperandType.Every || this.operands.output.type === OperandType_1.OperandType.Each) {
            let returnObj = this._comparisonOutputs;
            if (this.outputOne) {
                for (let key in returnObj) {
                    returnObj[key] = 1;
                }
            }
            return returnObj;
        }
    }
}
class DeciderCombinator extends Combinator {
    /*
    *   Constructor
    */
    constructor() {
        super();
    }
    /*
    *   Methods
    */
    tick() {
        this._calculate();
    }
    tock() {
        this.output = this._filteredOutputs;
    }
    _calculate() {
        let matches = {};
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
        let rightHandValue = 0;
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
            let leftHandValue = this._mergedInputs.hasOwnProperty(this.operands.left.name) ? this._mergedInputs[this.operands.left.name] : 0;
            this._comparisonOutputs = this.operator(leftHandValue, rightHandValue) ? this._mergedInputs : {};
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Any) {
            for (let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];
                if (this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = this._mergedInputs;
                    return;
                }
            }
            this._comparisonOutputs = {};
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Every) {
            for (let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];
                if (!this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = {};
                    return;
                }
            }
            this._comparisonOutputs = this._mergedInputs;
            return;
        }
        else if (this.operands.left.type === OperandType_1.OperandType.Each) {
            let matches = {};
            for (let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];
                if (this.operator(leftHandValue, rightHandValue)) {
                    matches[signal] = leftHandValue;
                }
            }
            if (this.operands.output.type === OperandType_1.OperandType.Each) {
                this._comparisonOutputs = matches;
                return;
            }
            else if (this.operands.output.type === OperandType_1.OperandType.Signal) {
                let signalValue = {};
                signalValue[this.operands.output.name] = 0;
                for (let key in matches) {
                    signalValue[this.operands.output.name] += matches[key];
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
    }
}
/*
*   Members
*/
DeciderCombinator.Operators = DeciderOperators;
exports.DeciderCombinator = DeciderCombinator;
//# sourceMappingURL=Combinator.js.map