// Interfaces
import { ComparisonFunction }   from './interfaces/ComparisonFunction';
import { ConduitProvider }      from './interfaces/ConduitProvider';
import { MathFunction }         from './interfaces/MathFunction';
import { OperandType }          from './interfaces/OperandType';
import { Operand }              from './interfaces/Operand';
import { SignalCollection }     from './interfaces/SignalCollection';
import { Signal }               from './interfaces/Signal';

// Classes
import { Conduit }              from './Conduit';
import * as _                   from 'lodash';

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

abstract class Combinator implements ConduitProvider {
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
    public values: Signal[];

    public outputOne: boolean;

    public abstract operator: {(left: number, right: number): any};

    protected _operationResultsOld: SignalCollection;

    protected _snapshot: {
        values: Signal[];
        operands: {
            left: Operand;
            right: Operand;
            output: Operand;
        };
        outputOne: boolean;
    };

    /*
    *   Constructor
    */
    constructor() {
        this.inputs = [];
        this.output = {};

        this.outputOne = false;

        this._operationResultsOld = {};

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

        this._snapshot = {
            values: [],
            operands: {
                left: { type: OperandType.Signal, name: '' },
                right: { type: OperandType.Signal, name: '' },
                output: { type: OperandType.Signal, name: '' },
            },
            outputOne: false,
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

            result = this._operationResultsOld;
        }
        else if (this.operands.output.type === OperandType.Each) {
            if (this.operands.left.type !== OperandType.Each) {
                throw('Combinator: Each cannot be an output type unless it is a left-hand operand');
            }

            result = this._operationResultsOld;
        }
        else if (this.operands.output.type === OperandType.Signal) {
            // Comparisons with an output type of Signal and an input of Each are a sum of all resulting matches
            //  for inputs of { A: 3, B: 2, C: 4 } | each > 2 output B = { B: 7 }
            if (this.operands.left.type === OperandType.Each) {
                result[this.operands.output.name] = 0;

                for (let key of Object.keys(this._operationResultsOld)) {
                    result[this.operands.output.name] += this._operationResultsOld[key];
                }
            }
            else {
                if (this._operationResultsOld.hasOwnProperty(this.operands.output.name)) {
                    result[this.operands.output.name] = this._operationResultsOld[this.operands.output.name];
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
    protected abstract _enforceIOTypeRules(): void;

    public tick(): void {
        // empty snapshot
        this._snapshot = {
            values: [],
            operands: {
                left: { type: OperandType.Signal, name: '' },
                right: { type: OperandType.Signal, name: '' },
                output: { type: OperandType.Signal, name: '' },
            },
            outputOne: false,
        };

        // enforce the rules so we don't have to do it later
        this._enforceIOTypeRules(); // Todo: probably this is not a good design pattern, a function that either throws or does not...

        // Take a snapshot of the current state to be used when we calculate
        let combinerConduit = new Conduit();

        combinerConduit.providers = this.inputs;

        this._snapshot = {
            values: _.cloneDeep(combinerConduit.values),
            operands: _.cloneDeep(this.operands),
            outputOne: this.outputOne,
        };
    }

    abstract tockNew(): void;
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

    protected _enforceIOTypeRules(): void {
        switch (this.operands.output.type) {
            case OperandType.Each: {
                if (this.operands.left.type !== OperandType.Each) {
                    throw('Combinator: Invalid output type "Each" without left-hand type "Each"');
                }
                break;
            }
            case OperandType.Every: {
                if (this.operands.left.type === OperandType.Each) {
                    throw('Combinator: Invalid output type "Every" with left-hand type "Each"');
                }
                break;
            }
            case OperandType.Any: {
                throw('Combinator: Invalid output type "Any"');
            }
            case OperandType.Constant: {
                throw('Combinator: Invalid output type "Constant"');
            }
            default: {
                break;
            }
        }
    }

    public tick(): void { // return an empty object if any operands are missing
        if ( Object.keys(this.operands.left).length === 0 ||
            Object.keys(this.operands.right).length === 0 ||
            Object.keys(this.operands.output).length === 0 ) {
                this._operationResultsOld = {};
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

        this._operationResultsOld = matches;
    }
    public tockNew(): void {
        // return an empty object if any operands are missing
        if ( Object.keys(this._snapshot.operands.left).length === 0 ||
            Object.keys(this._snapshot.operands.right).length === 0 ||
            Object.keys(this._snapshot.operands.output).length === 0 ) {
                this._operationResultsOld = {};
                return;
        }

        let matches: Signal[] = [];

        let rhv: Signal;

        let resolveNamedSignal = (name: string): Signal => {
            let signal: Signal = this._snapshot.values.find( (signal: Signal) => {
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
        switch (this._snapshot.operands.right.type) {
            case OperandType.Constant: {
                rhv = {
                    name: 'constant',
                    value: this._snapshot.operands.right.value ? this._snapshot.operands.right.value : 0,
                };

                break;
            }
            case OperandType.Signal: {
                rhv = resolveNamedSignal(this._snapshot.operands.right.name);

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
        switch (this._snapshot.operands.left.type) {
            case OperandType.Any: {
                if (this._snapshot.values.some(makeOperationTrue)) {
                    matches = this._snapshot.values;
                }
                else {
                    matches = [];
                }
                break;
            }
            case OperandType.Every: {
                if (this._snapshot.values.some(makeOperationFalse)) {
                    matches = [];
                }
                else {
                    matches = this._snapshot.values;
                }

                break;
            }
            case OperandType.Each: {
                matches = this._inputSignals.filter(makeOperationTrue);

                break;
            }
            case OperandType.Signal: {
                let lhv: Signal = resolveNamedSignal(this.operands.left.name);

                matches = this.operator(lhv.value, rhv.value) ? this._snapshot.values : [];

                break;
            }
            default: {
                throw('DeciderCombinator: Invalid left-hand operand');
            }
        }

        // apply outputOne
        matches = matches.map( (signal): Signal => {
            return { name: signal.name, value: 1 };
        });

        // filter based on output
        switch (this._snapshot.operands.output.type) {
            case OperandType.Each:
            case OperandType.Every: {
                break;
            }
            case OperandType.Signal: {
                let result: Signal = { name: this._snapshot.operands.output.name, value: 0 };

                // if the Each operand was used, we must accumulate all results
                if (this._snapshot.operands.left.type === OperandType.Each) {
                    result.value = matches.reduce( (acc, signal): number => {
                        return acc + signal.value;
                    }, 0);
                }
                else {
                    let val = matches.find( (signal) => {
                        return signal.name === this._snapshot.operands.output.name;
                    });

                    result.value = val !== undefined ? val.value : 0;
                }

                matches = [result];
            }
            default: {
                throw('DeciderCombinator: Invalid output operand');
            }
        }

        // remove zeros
        matches = matches.filter( (signal) => {
            return signal.value !== 0;
        });

        this.values = matches;
    }

    public tock(): void {
        this.output = this._filteredOutputs;
    }
}
