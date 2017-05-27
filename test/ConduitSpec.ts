/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { ConduitInput }    from '../src/interfaces/ConduitInput';
import { ConduitProvider }    from '../src/interfaces/ConduitProvider';

// Classes and Modules
import { expect }               from 'chai';
import { Conduit }              from '../src/Conduit';

describe('Conduit', () => {
    let cd: Conduit;
    let ci1: ConduitInput = { output: {} };
    let ci2: ConduitInput = { output: {} };

    let cp1: ConduitProvider = { values: [] };
    let cp2: ConduitProvider = { values: [] };

    beforeEach( () => {
        cd = new Conduit();

        ci1.output = { A: 1, B: 2, C: 3 };
        ci2.output = { A: 4, D: 8 };

        cp1.values = [
            { name: 'A', value: 1},
            { name: 'B', value: 2},
            { name: 'C', value: 3},
        ];

        cp2.values = [
            { name: 'A', value: 4 },
            { name: 'D', value: 8 },
        ];

        cd.inputs.push(ci1);
        cd.inputs.push(ci2);

        cd.providers.push(cp1, cp2);

    });

    it('should return an empty object in its default state', () => {
        cd = new Conduit();

        expect(cd.value).to.deep.equal({});
        expect(cd.values).to.be.empty;
    });

    it('should return an empty object if its sources are empty', () => {
        ci1.output = {};
        ci2.output = {};

        cp1.values = [];
        cp2.values = [];

        expect(cd.value).to.deep.equal({});
        expect(cd.values).to.be.empty;
    });

    it('should merge given input SignalCollections into one', () => {
        expect(cd.value).to.deep.equal({ A: 5, B: 2, C: 3, D: 8 });
        expect(cd.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);
    });

    it('should remove signals with a value of 0 from its output', () => {
        ci1.output = { A: 5 };
        ci2.output = { A: -5 };

        cp1.values = [{ name: 'A', value: 5}];
        cp2.values = [{ name: 'A', value: -5}, {name: 'B', value: 3}];

        expect(cd.value).to.deep.equal({});
        expect(cd.values).to.deep.equal([{ name: 'B', value: 3 }]);
    });
});
