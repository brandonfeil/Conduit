// Interfaces
import { ConduitInput }     from './interfaces/ConduitInput';
import { ConduitProvider }  from './interfaces/ConduitProvider';
import { SignalCollection } from './interfaces/SignalCollection';

export class Conduit {
    /*
    *   Members
    */
    public inputs: ConduitInput[];
    public providers: ConduitProvider[];

    /*
    *   Constructor
    */
    constructor() {
        this.inputs = [];
    }

    /*
    *   Getters/Setters
    */
    public get value(): SignalCollection {
        let result: SignalCollection = {}; // Object.assign({}, ...this.inputs);

        // merge all SignalCollections into one
        for (let input of this.inputs) {
            Object.assign(result, input.output);
        }

        // zero out the values
        for (let key of Object.keys(result)) {
            result[key] = 0;
        }

        // loop through each input Signals and add its values to the rest
        for (let input of this.inputs) {
            for (let key of Object.keys(input.output)) {
                result[key] += input.output[key];
            }
        }

        // Remove signals with a value of 0
        for (let key in result) {
            if (result[key] === 0) {
                delete result[key];
            }
        }

        return result;
    }
}
