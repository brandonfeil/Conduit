/// <reference types="mocha" />
/// <reference types="chai" />

import { DeciderCombinator } from '../src/Combinator2';
import { Circuit } from '../src/Circuit';
import { SignalValueProvider } from '../src/interfaces/SignalValueProvider';
import { SignalType } from '../src/interfaces/SignalType';
import { SignalID } from '../src/interfaces/SignalID';

import { expect } from 'chai';

describe ('DeciderCombinator', () => {
    let dc: DeciderCombinator;

    let svp1: SignalValueProvider;
    let svp2: SignalValueProvider;

    let sigA: SignalID = { type: SignalType.virtual, name: 'a' };
    let sigB: SignalID = { type: SignalType.virtual, name: 'b' };
    let sigC: SignalID = { type: SignalType.virtual, name: 'c' };
    let sigD: SignalID = { type: SignalType.virtual, name: 'd' };
    let sigE: SignalID = { type: SignalType.virtual, name: 'e' };
    let sigF: SignalID = { type: SignalType.virtual, name: 'f' };

    beforeEach( () => {
        dc = new DeciderCombinator();

        svp1 = {
            signals: [
                { signal: sigA, count: -1 },
                { signal: sigB, count: 1 },
                { signal: sigC, count: 2 },
                { signal: sigD, count: 3 },
                { signal: sigE, count: 4 },
                { signal: sigF, count: 2 },
            ],
        };

        svp2 = {
            signals: [
                { signal: sigB, count: -1 },
                { signal: sigF, count: 2 },
            ],
        };

        dc.connections.push(svp1, svp2);

        dc.control_behavior.first_signal = sigC;
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = sigA;
        dc.control_behavior.comparator = '>';
        dc.control_behavior.copy_count_from_input = true;
    });

    it('Should return an empty result if any of its settings is empty', () => {
        // left hand missing
        dc.control_behavior.first_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);

        // right hand missing
        dc.control_behavior.first_signal = sigC;
        dc.control_behavior.second_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);

        // output missing
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);

        // comparator missing
        dc.control_behavior.output_signal = sigA;
        dc.control_behavior.comparator = undefined;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);

        // copy_count.... missing
        dc.control_behavior.comparator = '>';
        dc.control_behavior.copy_count_from_input = undefined;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);
    });
});
