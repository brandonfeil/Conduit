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

    protected outputOne: boolean;

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
        this.values = [];

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

    abstract tock(): void;
}

export class DeciderCombinator extends Combinator {
    /*
    *   Members
    */
    public static Operators = DeciderOperators;
    public operator: ComparisonFunction;

    public outputOne: boolean;

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
                    throw('DeciderCombinator: Invalid output type "Each" without left-hand type "Each"');
                }
                break;
            }
            case OperandType.Every: {
                if (this.operands.left.type === OperandType.Each) {
                    throw('DeciderCombinator: Invalid output type "Every" with left-hand type "Each"');
                }
                break;
            }
            case OperandType.Any: {
                throw('DeciderCombinator: Invalid output type "Any"');
            }
            case OperandType.Constant: {
                throw('DeciderCombinator: Invalid output type "Constant"');
            }
            default: {
                break;
            }
        }
    }

    public tock(): void {
        // return an empty object if any operands are missing
        if ( Object.keys(this._snapshot.operands.left).length === 0 ||
            Object.keys(this._snapshot.operands.right).length === 0 ||
            Object.keys(this._snapshot.operands.output).length === 0 ) {
                this.values = [];
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
                matches = this._snapshot.values.filter(makeOperationTrue);

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
        if (this._snapshot.outputOne) {
            matches = matches.map( (signal): Signal => {
                return { name: signal.name, value: 1 };
            });
        }

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
                break;
            }
            default: {
                throw('DeciderCombinator: Invalid output operand');
            }
        }

        // remove zero
        matches = matches.filter( (signal) => {
            return signal.value !== 0;
        });

        this.values = matches;
    }
}

export class ArithmeticCombinator extends Combinator {
    /*
    *   Members
    */
    public static Operators = MathOperators;
    public operator: MathFunction;

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
                throw('ArithmeticCombinator: Invalid output type "Every"');
            }
            case OperandType.Any: {
                throw('ArithmeticCombinator: Invalid output type "Any"');
            }
            case OperandType.Constant: {
                throw('ArithmeticCombinator: Invalid output type "Constant"');
            }
            default: {
                break;
            }
        }
    }

    public tock(): void {
        // return an empty object if any operands are missing
        if ( Object.keys(this._snapshot.operands.left).length === 0 ||
            Object.keys(this._snapshot.operands.right).length === 0 ||
            Object.keys(this._snapshot.operands.output).length === 0 ) {
                this.values = [];
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
                throw('ArithmeticCombinator: Invalid right-hand operand');
            }
        }

        // calculate based on left-hand
        switch (this._snapshot.operands.left.type) {
            case OperandType.Each: {
                matches = this._snapshot.values.map( (lhv: Signal) => {
                    let result: Signal = lhv;

                    result.value = this.operator(lhv.value, rhv.value);
                    return result;
                });

                break;
            }
            case OperandType.Signal: {
                let lhv: Signal = resolveNamedSignal(this.operands.left.name);
                let result: Signal = lhv;

                result.value = this.operator(lhv.value, rhv.value);

                matches = [result];

                break;
            }
            default: {
                throw('ArithmeticCombinator: Invalid left-hand operand');
            }
        }

        // filter based on output
        switch (this._snapshot.operands.output.type) {
            case OperandType.Each: {
                break;
            }
            case OperandType.Signal: {
                let result: Signal = { name: this._snapshot.operands.output.name, value: 0 };

                result.value = matches.reduce( (acc, signal): number => {
                    return acc + signal.value;
                }, 0);

                matches = [result];
                break;
            }
            default: {
                throw('ArithmeticCombinator: Invalid output operand');
            }
        }

        // remove zero
        matches = matches.filter( (signal) => {
            return signal.value !== 0;
        });

        this.values = matches;
    }
}
