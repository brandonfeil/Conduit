// Interfaces
import { ConduitInput }     from "./interfaces/ConduitInput"
import { SignalCollection } from "./interfaces/SignalCollection"

export class Conduit {
    constructor() {
        this.inputs = [];
    }

    public inputs: ConduitInput[];

    public get value(): SignalCollection {
        let result: SignalCollection = {}; // Object.assign({}, ...this.inputs);

        // merge all SignalCollections into one
        for(let input of this.inputs) {
            Object.assign(result, input.output);
        }

        // zero out the values
        for(let key in result) {
            result[key] = 0;
        }
        
        // loop through each input Signals and add its values to the rest
        for(let input of this.inputs) {
            for(let key in input.output) {
                result[key] += input.output[key];
            }
        }

        // Remove signals with a value of 0
        for(let key in result) {
            if(result[key] === 0) {
                delete result[key];
            }
        }

        return result;
    }
}