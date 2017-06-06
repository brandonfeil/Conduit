/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { SignalValueProvider }    from '../src/interfaces/SignalValueProvider';

// Classes and Modules
import { expect }               from 'chai';
import { Circuit }              from '../src/Circuit';
import { SignalType }           from '../src/interfaces/SignalType';

describe('Circuit', () => {
    let cir: Circuit;

    let svp1: SignalValueProvider =  { signals: [] };
    let svp2: SignalValueProvider =  { signals: [] };

    beforeEach( () => {
        cir = new Circuit();

        svp1.signals = [
            { signal: { name: 'signal-A', type: SignalType.virtual }, count: 1 },
            { signal: { name: 'signal-B', type: SignalType.virtual }, count: 2 },
            { signal: { name: 'signal-C', type: SignalType.virtual }, count: 3 },
        ];

        svp2.signals = [
            { signal: { name: 'signal-A', type: SignalType.virtual }, count: 4 },
            { signal: { name: 'signal-D', type: SignalType.virtual }, count: 8 },
        ];


        cir.providers.push(svp1, svp2);
    });

    it('should return an empty object in its default state', () => {
        cir = new Circuit();

        expect(cir.signals).to.be.empty;
    });

    it('should return an empty object if its sources are empty', () => {
        svp1.signals = [];
        svp2.signals = [];

        expect(cir.signals).to.be.empty;
    });

    it('should merge given input Signals into one', () => {
        expect(cir.signals).to.deep.equal([
            { signal: { name: 'signal-A', type: SignalType.virtual }, count: 5 },
            { signal: { name: 'signal-B', type: SignalType.virtual }, count: 2 },
            { signal: { name: 'signal-C', type: SignalType.virtual }, count: 3 },
            { signal: { name: 'signal-D', type: SignalType.virtual }, count: 8 },
        ]);
    });

    it('should remove signals with a value of 0 from its output', () => {
        svp1.signals = [{ signal: { name: 'signal-A', type: SignalType.virtual }, count: 5 }, { signal: { name: 'signal-B', type: SignalType.virtual }, count: 3 }];
        svp2.signals = [{ signal: { name: 'signal-A', type: SignalType.virtual }, count: -5 }];

        expect(cir.signals).to.deep.equal([{signal: { name: 'signal-B', type: SignalType.virtual }, count: 3 }]);
    });
});
