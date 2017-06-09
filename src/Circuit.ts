import { Signal }               from './interfaces/Signal';
import { SignalValueProvider }  from './interfaces/SignalValueProvider';

import * as _ from 'lodash';

export class Circuit {
    public providers: SignalValueProvider[];

    constructor() {
        this.providers = [];
    }

    public get signals(): Signal[] {
        let merged: Signal[] = [];

        for (let provider of this.providers) {
            merged = merged.concat(provider.signals);
        }

        let deduped: Signal[] = _.cloneDeep(_.uniqBy(merged, 'signal.name'));

        for (let signal of deduped) {
            signal.count = 0;
        }

        merged.forEach( (mergedEntry) => {
            let index = _.findIndex(deduped, { signal: mergedEntry.signal });

            deduped[index].count += mergedEntry.count;
        });

        return _.pullAllBy(deduped, [{ count: 0 }], 'count');
    }
}
