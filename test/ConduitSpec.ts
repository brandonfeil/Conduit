/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { ConduitProvider }    from '../src/interfaces/ConduitProvider';

// Classes and Modules
import { expect }               from 'chai';
import { Circuit }              from '../src/Conduit';

describe('Conduit', () => {
    let cd: Circuit;

    let cp1: ConduitProvider = { values: [] };
    let cp2: ConduitProvider = { values: [] };

    beforeEach( () => {
        cd = new Circuit();

        cp1.values = [
            { name: 'A', value: 1},
            { name: 'B', value: 2},
            { name: 'C', value: 3},
        ];

        cp2.values = [
            { name: 'A', value: 4 },
            { name: 'D', value: 8 },
        ];

        cd.providers.push(cp1, cp2);

    });

    it('should return an empty object in its default state', () => {
        cd = new Circuit();

        expect(cd.values).to.be.empty;
    });

    it('should return an empty object if its sources are empty', () => {
        cp1.values = [];
        cp2.values = [];

        expect(cd.values).to.be.empty;
    });

    it('should merge given input SignalCollections into one', () => {
        expect(cd.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);
    });

    it('should remove signals with a value of 0 from its output', () => {
        cp1.values = [{ name: 'A', value: 5}];
        cp2.values = [{ name: 'A', value: -5}, {name: 'B', value: 3}];

        expect(cd.values).to.deep.equal([{ name: 'B', value: 3 }]);
    });
});
