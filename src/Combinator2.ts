import { Signal } from './interfaces/Signal';
import { SignalID } from './interfaces/SignalID';
import { SignalValueProvider } from './interfaces/SignalValueProvider';
import { Clockable } from './interfaces/Clockable';
import { DeciderConditions } from './interfaces/DeciderConditions';

import { Circuit } from './Circuit';
import * as _ from 'lodash';

abstract class Combinator implements SignalValueProvider, Clockable {
    // Properties --------------------------------------------------
    // Public
    public connections: SignalValueProvider[];
    public control_behavior: any;
    public signals: Signal[];

    // Methods --------------------------------------------------
    public abstract tick(): void;
    public abstract tock(): void;

    // Constructor --------------------------------------------------
    constructor () {
        this.connections = [];
        this.control_behavior = undefined;
        this.signals = [];
    }
}

export class DeciderCombinator extends Combinator {
    // Properties --------------------------------------------------
    // Public
    public control_behavior: DeciderConditions;

    // Private
    private _snapshot: { control_behavior: DeciderConditions, signals: Signal[] };

    // Methods --------------------------------------------------
    public tick(): void {
        let mergeCircuit = new Circuit();

        mergeCircuit.providers = this.connections;

        this._snapshot.signals = _.cloneDeep(mergeCircuit.signals);
        this._snapshot.control_behavior = _.cloneDeep(this.control_behavior);
    }

    public tock(): void {
        
    }

    // Constructor --------------------------------------------------
    constructor () {
        super();

        this._snapshot = { control_behavior: {}, signals: [] };
    }


}
