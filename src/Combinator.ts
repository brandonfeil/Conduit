// Interfaces
import { ComparisonFunction }   from "./interfaces/ComparisonFunction"
import { OperandType }          from "./interfaces/OperandType"
import { Operand }              from "./interfaces/Operand"
import { SignalCollection }     from "./interfaces/SignalCollection"

// Classes
import { Conduit }              from "./Conduit"

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
    }
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

    protected _comparisonOutputs: SignalCollection;
    
    abstract operator: {(left: number, right: number): any};
    
    /*
    *   Constructor
    */
    constructor() {
        this.inputs = [];
        this.output = {};

        this.outputOne = false;

        this._comparisonOutputs = {};

        this.operator = (l: number, r: number) => { return false; };

        this.operands = {
            left: {
                type: OperandType.Signal,
                name: ""
            },
            right: {
                type: OperandType.Signal,
                name: ""
            },
            output: {
                type: OperandType.Signal,
                name: ""
            },
        }
    }
    
 
    /*
    *   Getters/Setters
    */
    protected get _mergedInputs(): SignalCollection {
        let inputCollections: SignalCollection[] = [];

        for(let input of this.inputs) {
            inputCollections.push(input.value);
        }

        // get merged properties
        let result: SignalCollection = Object.assign({}, ...inputCollections);

        // then zero out the merged list so we can ADD the original inputs together
        for(let key in result) {
            result[key] = 0;
        }

        // loop through each input Signals and add its values to the rest
        for(let input of inputCollections) {
            for(let key in input) {
                result[key] += input[key];
            }
        }

        // in Factorio, a signal ceases to exist if its value is 0
        for(let key in result) {
            if(result[key] === 0) {
                delete result[key];
            }
        }

        return result;
    }

    protected get _filteredOutputs(): SignalCollection {
        // if there is no output operand, return an empty object
        if(Object.keys(this.operands.output).length === 0) {
            return {};
        }

        if(this.operands.output.type === OperandType.Signal) {
            if(this.outputOne) {
                let returnObj: SignalCollection = {};

                if(Object.keys(this._comparisonOutputs).length > 0) {
                    returnObj[this.operands.output.name] = 1;
                }

                return returnObj; 
            }
            else {
                let returnObj: SignalCollection = {};

                if(this._comparisonOutputs.hasOwnProperty(this.operands.output.name)) {
                    returnObj[this.operands.output.name] = this._comparisonOutputs[this.operands.output.name];
                }

                return returnObj;
            }
        }

        else if(this.operands.output.type === OperandType.Every || this.operands.output.type === OperandType.Each) {
            let returnObj = this._comparisonOutputs;

            if(this.outputOne) {
                for(let key in returnObj) {
                    returnObj[key] = 1;
                }
            }

            return returnObj;
        }
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
        this._calculate();
    }

    public tock(): void {
        this.output = this._filteredOutputs;
    }

    private _calculate(): void {
        let matches = {};

        // return an empty object if any operands are missing
        if( Object.keys(this.operands.left).length === 0 ||
            Object.keys(this.operands.right).length === 0 ||
            Object.keys(this.operands.output).length === 0 ) {
                this._comparisonOutputs = {};
                return;
        }

        // throw an error if the output types are wrong
        if(this.operands.output.type === OperandType.Each && this.operands.left.type !== OperandType.Each) {
            throw("DeciderCombinator: Each is only a valid output if it is also the left-hand operator");
        }

        // establish rightHand value
        let rightHandValue: number = 0;

        if(this.operands.right.type === OperandType.Constant) {
            rightHandValue = this.operands.right.value ? this.operands.right.value : 0;
        } 
        else if(this.operands.right.type === OperandType.Signal) {
            rightHandValue = this._mergedInputs.hasOwnProperty(this.operands.right.name) ? this._mergedInputs[this.operands.right.name] : 0;
        }
        else {
            throw("DeciderCombinator: Virtual signals cannot be right-hand operators");
        }
        
        // calculate based on left hand type

        // Signal (Only one comparison)
        if(this.operands.left.type === OperandType.Signal) {

            let leftHandValue = this._mergedInputs.hasOwnProperty(this.operands.left.name) ? this._mergedInputs[this.operands.left.name] : 0;

            this._comparisonOutputs = this.operator(leftHandValue, rightHandValue) ? this._mergedInputs : {};
            return;
        }

        // Any (True if anything matches)
        else if(this.operands.left.type === OperandType.Any) {

            for(let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];

                
                if(this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = this._mergedInputs;
                    return;
                }
            }

            this._comparisonOutputs = {};
            return;
        }

        // Every (True if everything matches)
        else if(this.operands.left.type === OperandType.Every) {

            for(let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];

                if(!this.operator(leftHandValue, rightHandValue)) {
                    this._comparisonOutputs = {};
                    return;
                }
            }

            this._comparisonOutputs = this._mergedInputs;
            return;
        }

        // Each (True if there are any matches)
        else if(this.operands.left.type === OperandType.Each) {
            let matches: SignalCollection = {};

            for(let signal in this._mergedInputs) {
                let leftHandValue = this._mergedInputs[signal];

                if(this.operator(leftHandValue, rightHandValue)) {
                    matches[signal] = leftHandValue;
                }
            }

            if(this.operands.output.type === OperandType.Each) {
                this._comparisonOutputs = matches;
                return;
            }
            else if(this.operands.output.type === OperandType.Signal) {
                let signalValue: SignalCollection = {};

                signalValue[this.operands.output.name] = 0;

                for(let key in matches) {
                    signalValue[this.operands.output.name] += matches[key];
                }

                this._comparisonOutputs = signalValue;
                return;                    
            }
            else {
                throw("DeciderCombinator: Invalid output type with input type 'Each'");
            }
        }

        // Any other types are invalid
        else {
            throw("DeciderCombinator: Invalid left-hand type");
        }
    }
}
    







