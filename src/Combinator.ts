// Interfaces
import { ComparisonFunction }   from './interfaces/ComparisonFunction';
import { MathFunction }         from './interfaces/MathFunction';
import { OperandType }          from './interfaces/OperandType';
import { Operand }              from './interfaces/Operand';
import { SignalCollection }     from './interfaces/SignalCollection';

// Classes
import { Conduit }              from './Conduit';

const DeciderOperators: { [funcName: string]: ComparisonFunction } = {
    lt: (L: number, R: number): boolean => {
        return (L < R);
    },
    gt: (L: number, R: number): boolean => {
        return (L > R);
    },
    lte: (L: number, R: number): boolean => {
        return (L <= R);
    },
    gte: (L: number, R: number): boolean => {
        return (L >= R);
    },
    eq: (L: number, R: number): boolean => {
        return (L === R);
    },
    neq: (L: number, R: number): boolean => {
        return (L !== R);
    },
};

const MathOperators: { [funcName: string]: MathFunction } = {
    add: (L: number, R: number): number => {
        return Math.trunc(L + R);
    },
};

abstract class Combinator {
    /*
    *   Members
    */
    public inputs: Conduit[];
    public operands: {
        left: Operand;
        right: Operand;
        output: Operand;
    };
    public output: SignalCollection;
    public outputOne: boolean;

    protected _operationResults: SignalCollection;

    abstract operator: {(left: number, right: number): any};

    /*
    *   Constructor
    */
    constructor() {
        this.inputs = [];
        this.output = {};

        this.outputOne = false;

        this._operationResults = {};

        this.operator = (l: number, r: number) => { return false; };

        this.operands = {
            left: {
                type: OperandType.Signal,
                // tslint:disable-next-line:object-literal-sort-keys
                name: '',
            },
            right: {
                type: OperandType.Signal,
                name: '',
            },
            output: {
                type: OperandType.Signal,
                name: '',
            },
        };
    }

    /*
    *   Getters/Setters
    */
    protected get _mergedInputs(): SignalCollection {
        let inputCollections: SignalCollection[] = [];

        for (let conduit of this.inputs) {
            inputCollections.push(conduit.value); 
        }

        // get merged properties
        let result: SignalCollection = Object.assign({}, ...inputCollections);

        // then zero out the merged list so we can ADD the original inputs together
        for (let key of Object.keys(result)) {
            result[key] = 0;
        }

        // loop through each input Signals and add its values to the rest
        for (let input of inputCollections) {
            for (let key of Object.keys(input)) {
                result[key] += input[key];
            }
        }

        // in Factorio, a signal ceases to exist if its value is 0
        for (let key of Object.keys(result)) {
            if (result[key] === 0) {
                delete result[key];
            }
        }

        return result;
    }

    protected get _filteredOutputs(): SignalCollection {
        // if there is no output operand, return an empty object
        if (Object.keys(this.operands.output).length === 0) {
            return {};
        }

        let result: SignalCollection = {};

        if (this.operands.output.type === OperandType.Every) {
            if (this.operands.left.type === OperandType.Each) {
                throw('Combinator: Every cannot be an output type left-hand operand Each');
            }

            result = this._operationResults;
        }
        else if (this.operands.output.type === OperandType.Each) {
            if (this.operands.left.type !== OperandType.Each) {
                throw('Combinator: Each cannot be an output type unless it is a left-hand operand');
            }

            result = this._operationResults;
        }
        else if (this.operands.output.type === OperandType.Signal) {
            // Comparisons with an output type of Signal and an input of Each are a sum of all resulting matches
            //  for inputs of { A: 3, B: 2, C: 4 } | each > 2 output B = { B: 7 }
            if (this.operands.left.type === OperandType.Each) {
                result[this.operands.output.name] = 0;

                for (let key of Object.keys(this._operationResults)) {
                    result[this.operands.output.name] += this._operationResults[key];
                }
            }
            else {
                if (this._operationResults.hasOwnProperty(this.operands.output.name)) { 
                    result[this.operands.output.name] = this._operationResults[this.operands.output.name];
                }
            }
        }
        else {
            throw('Combinator: invalid output operand');
        }

        if (this.outputOne) {
            for (let key of Object.keys(result)) {
                result[key] = 1;
            }
        }

        return result;
    }

    /*
    *   Methods
    */

    abstract tick(): void;
    abstract tock(): void;
}

export class DeciderCombinator extends Combinator {
    /*
    *   Members
    */
    public static Operators = DeciderOperators;
    public operator: ComparisonFunction;

    /*
    *   Constructor
    */
    constructor() {
        super();
    }

    /*
    *   Methods
    */
    public tick(): void {
        // return an empty object if any operands are missing
        if ( Object.keys(this.operands.left).length === 0 ||
            Object.keys(this.operands.right).length === 0 ||
            Object.keys(this.operands.output).length === 0 ) {
                this._operationResults = {};
                return;
        }

        // establish rightHand value
        let rightHandValue = 0;

        if (this.operands.right.type === OperandType.Constant) {
            rightHandValue = this.operands.right.value ? this.operands.right.value : 0;
        }
        else if (this.operands.right.type === OperandType.Signal) {
            rightHandValue = this._mergedInputs.hasOwnProperty(this.operands.right.name) ? this._mergedInputs[this.operands.right.name] : 0;
        }
        else {
            throw('DeciderCombinator: Virtual signals cannot be right-hand operators');
        }

        // calculate based on left hand type

        let matches: SignalCollection = {};

        // Signal (Only one comparison)
        if (this.operands.left.type === OperandType.Signal) {
            let leftHandValue = this._mergedInputs.hasOwnProperty(this.operands.left.name) ? this._mergedInputs[this.operands.left.name] : 0;

            if (this.operator(leftHandValue, rightHandValue)) {
                matches = this._mergedInputs;
            }
        }
        // Any (True if anything matches)
        else if (this.operands.left.type === OperandType.Any) {
            for (let signal of Object.keys(this._mergedInputs)) {
                let leftHandValue = this._mergedInputs[signal];

                if (this.operator(leftHandValue, rightHandValue)) {
                    matches = this._mergedInputs;
                    break;
                }
            }
        }
        // Every (True if everything matches)
        else if (this.operands.left.type === OperandType.Every) {
            matches = this._mergedInputs;

            for (let signal of Object.keys(this._mergedInputs)) {
                let leftHandValue = this._mergedInputs[signal];

                if (!this.operator(leftHandValue, rightHandValue)) {
                    matches = {};
                }
            }
        }
        // Each (True if there are any matches)
        else if (this.operands.left.type === OperandType.Each) {
            for (let signal of Object.keys(this._mergedInputs)) {
                let leftHandValue = this._mergedInputs[signal];

                if (this.operator(leftHandValue, rightHandValue)) {
                    matches[signal] = leftHandValue;
                }
            }
        }
        // Any other types are invalid
        else {
            throw('DeciderCombinator: Invalid left-hand type');
        }

        this._operationResults = matches;
    }

    public tock(): void {
        this.output = this._filteredOutputs;
    }

}
