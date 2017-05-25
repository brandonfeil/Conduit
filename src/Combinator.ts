// Interfaces
import { ComparisonFunction }   from './interfaces/ComparisonFunction';
import { MathFunction }         from './interfaces/MathFunction';
import { OperandType }          from './interfaces/OperandType';
import { Operand }              from './interfaces/Operand';
import { SignalCollection }     from './interfaces/SignalCollection';
import { Signal }               from './interfaces/Signal';

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
    subtract: (L: number, R: number): number => {
        return Math.trunc(L - R);
    },
    multiply: (L: number, R: number): number => {
        return Math.trunc(L * R);
    },
    divide: (L: number, R: number): number => {
        return Math.trunc(L / R);
    },
    mod: (L: number, R: number): number => {
        return Math.trunc(L % R);
    },
    rightShift: (L: number, R: number): number => {
        return L >> R;
    },
    leftShift: (L: number, R: number): number => {
        return L << R;
    },
    and: (L: number, R: number): number => {
        return L & R;
    },
    or: (L: number, R: number): number => {
        return L | R;
    },
    xor: (L: number, R: number): number => {
        return L ^ R;
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

    protected get _inputSignals(): Signal[] {
        let result: Signal[] = [];

        for (let signal of Object.keys(this._mergedInputs)) {
            result.push({
                name: signal,
                value: this._mergedInputs[signal],
            });
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

        let matches: SignalCollection = {};

        // establish leftHand value


        let rhv: Signal;

        let resolveNamedSignal = (name: string): Signal => {
            let signal: Signal = this._inputSignals.find( (signal: Signal) => {
                return signal.name === name;
            });

            if (signal === undefined) {
                signal = {
                    name: 'notFound',
                    value: 0,
                };
            }

            return signal;
        };

        // establish right-hand operand value
        switch (this.operands.right.type) {
            case OperandType.Constant: {
                rhv = {
                    name: 'constant',
                    value: this.operands.right.value ? this.operands.right.value : 0,
                };

                break;
            }
            case OperandType.Signal: {
                rhv = resolveNamedSignal(this.operands.right.name);

                break;
            }
            default: {
                throw('DeciderCombinator: Invalid right-hand operand');
            }
        }

        // some functions to help our array processing
        let makeOperationTrue = (lhv: Signal) => {
            return this.operator(lhv.value, rhv.value);
        };

        let makeOperationFalse = (lhv: Signal) => {
            return !this.operator(lhv.value, rhv.value);
        };

        // calculate based on left-hand
        switch (this.operands.left.type) {
            case OperandType.Any: {
                if (this._inputSignals.some(makeOperationTrue)) {
                    matches = this._mergedInputs;
                }
                else {
                    matches = {};
                }
                break;
            }
            case OperandType.Every: {
                if (this._inputSignals.some(makeOperationFalse)) {
                    matches = {};
                }
                else {
                    matches = this._mergedInputs;
                }

                break;
            }
            case OperandType.Each: {
                let res: Signal[];

                res = this._inputSignals.filter(makeOperationTrue);

                // Remove later when refactoring Signal Collection to Signal[]
                res.forEach( (match: Signal) => {
                    matches[match.name] = match.value;
                });

                break;
            }
            case OperandType.Signal: {
                let lhv: Signal = resolveNamedSignal(this.operands.left.name);

                matches = this.operator(lhv.value, rhv.value) ? this._mergedInputs : {};

                break;
            }
            default: {
                throw('DeciderCombinator: Invalid left-hand operand');
            }
        }

        this._operationResults = matches;
    }

    public tock(): void {
        this.output = this._filteredOutputs;
    }
}
