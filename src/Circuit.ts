import { Signal }               from './interfaces/Signal';
import { SignalValueProvider }  from './interfaces/SignalValueProvider';

export class Circuit {
    public providers: SignalValueProvider[];

    constructor() {
        this.providers = [];
    }

    public get signals(): Signal[] {
        let merged: Signal[] = [];

        // merge
        for (let provider of this.providers) {
            merged = merged.concat(provider.signals);
        }

        // get all unique signals contained in merged
        let deduped: Signal[] = merged.filter( (mergedEntry, i, arr) => {
            // only include entries if they are the first instance of it in the array
            return i === arr.findIndex( (findEntry) => {
                return findEntry.signal.name === mergedEntry.signal.name;
            });
        });

        // collect and sum values for each unique signal
        let result: Signal[] = deduped.map( (uniqueEntry): Signal => {
            let resultSignal: Signal = {
                signal: uniqueEntry.signal,
                count: 0,
            };

            // find all input Signals with the uniqueSignal's name and accumulate their values
            resultSignal.count = merged.filter( (filterEntry) => {
                return filterEntry.signal.name === uniqueEntry.signal.name;
            })
            .reduce( (curCount, reduceEntry): number => {
                return curCount + reduceEntry.count;
            }, 0);

            return resultSignal;
        });

        // return signals with a value !== 0
        return result.filter( (entry) => {
            return entry.count !== 0;
        });
    }
}
