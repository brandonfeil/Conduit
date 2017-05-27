// Interfaces
import { ConduitInput }     from './interfaces/ConduitInput';
import { ConduitProvider }  from './interfaces/ConduitProvider';
import { Signal }           from './interfaces/Signal';
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
        this.providers = [];
    }

    /*
    *   Getters/Setters
    */
    public get values(): Signal[] {
        let merged: Signal[] = [];

        // merge
        for (let provider of this.providers) {
            merged = merged.concat(provider.values);
        }

        // get all unique signals contained in merged
        let deduped: Signal[] = merged.filter( (signal, i, arr) => {
            return i === arr.findIndex( (s) => {
                return s.name === signal.name;
            });
        });

        // collect and sum values for each unique signal
        let result: Signal[] = deduped.map( (uniqueSignal): Signal => {
            let resultSignal: Signal = {
                name: uniqueSignal.name,
                value: 0,
            };

            // find all input Signals with the uniqueSignal's name and accumulate their values
            resultSignal.value = merged.filter( (signal) => {
                return signal.name === uniqueSignal.name;
            })
            .reduce( (acc, signal): number => {
                return acc + signal.value;
            }, 0);

            return resultSignal;
        });

        // return signals with a value !== 0
        return result.filter( (signal) => {
            return signal.value !== 0;
        });
    }

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
