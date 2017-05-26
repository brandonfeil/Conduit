import { SignalCollection } from './SignalCollection';
import { Signal } from './Signal';

export interface ConduitInput {
    output: SignalCollection;
}

export interface ConduitProvider {
    value: Signal[];
}
