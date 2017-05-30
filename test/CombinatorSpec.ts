/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { OperandType }          from '../src/interfaces/OperandType';
import { Operand }              from '../src/interfaces/Operand';
import { ConduitInput }         from '../src/interfaces/ConduitInput';
import { ConduitProvider }      from '../src/interfaces/ConduitProvider';

// Classes and Modules
import { expect }               from 'chai';
import { DeciderCombinator, ArithmeticCombinator }    from '../src/Combinator';
import { Conduit }              from '../src/Conduit';

describe ('Decider Combinator', () => {
    let dc: DeciderCombinator;
    let cd1: Conduit;
    let cd2: Conduit;
    let cp1: ConduitProvider = { values: [] };
    let cp2: ConduitProvider = { values: [] };

    const sigA: Operand = { type: OperandType.Signal, name: 'A' };
    const sigB: Operand = { type: OperandType.Signal, name: 'B' };
    const sigC: Operand = { type: OperandType.Signal, name: 'C' };
    const sigD: Operand = { type: OperandType.Signal, name: 'D' };
    const sigE: Operand = { type: OperandType.Signal, name: 'E' };

    const const1: Operand = { type: OperandType.Constant, value: 1 };
    const const100: Operand = { type: OperandType.Constant, value: 100 };

    const any: Operand = { type: OperandType.Any };
    const each: Operand = { type: OperandType.Each };
    const every: Operand = { type: OperandType.Every };

    const empty: Operand = (<Operand>{});
    const noName: Operand = { type: OperandType.Signal };
    const noVal: Operand = { type: OperandType.Constant };

    beforeEach( () => {
        dc = new DeciderCombinator();

        cd1 = new Conduit();
        cd2 = new Conduit();

        cp1.values = [
            { name: 'A', value: 1 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'E', value: 11 },
        ];

        cp2.values = [
            { name: 'A', value: 4 },
            { name: 'D', value: 8 },
            { name: 'E', value: -11 },
        ];

        cd1.providers.push(cp1);

        cd2.providers.push(cp2);

        dc.inputs.push(cd1, cd2);
    });

    it ('should return empty outputs when run in a default state', () => {
        let dc = new DeciderCombinator();

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.be.empty;
    });

    it ('should return empty outputs when run with an empty operand', () => {
        // Left hand missing
        dc.operands.left = empty;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.deep.equal([]);

        // Right hand missing
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = empty;
        dc.operands.output = sigB;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.deep.equal([]);

        // Output missing
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = empty;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.deep.equal([]);
    });

    it ('should perform simple comparisons', () => {
        cp1.values = [];
        cp2.values = [
            { name: 'A', value: 3 },
            { name: 'B', value: 2 },
            { name: 'C', value: 2 },
            { name: 'D', value: 1 },
        ];

        // A opr B output B
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2 }]);

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.gte;
        dc.operands.right = sigC;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2 }]);

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.lte;
        dc.operands.right = sigC;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2 }]);

        dc.operands.left = sigD;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = sigC;
        dc.operands.output = sigD;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'D', value: 1 }]);

        dc.operands.left = sigC;
        dc.operator = DeciderCombinator.Operators.eq;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2}]);

        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.neq;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2}]);
    });

    it ('should return treat "signal" input operands with no name as having a value of 0', () => {

        // "Signal" types should include names
        dc.operands.left = noName;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2}]);

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = noName;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'B', value: 2}]);
    });

    it ('should treat "constant" input operands with no value as having a value of 0', () => {

        // "Signal" types should include names
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = noVal;
        dc.operands.output = sigA;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'A', value: 5 }]);

        cp1.values[0].value = 0;
        cp2.values[0].value = -5;

        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = noVal;
        dc.operands.output = sigA;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([{ name: 'A', value: -5 }]);
    });

    it ('should handle an output type of "every"', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if A > B, output everything
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);
    });

    it ('should handle a left hand operand of "every"', () => {
        cp1.values = [];
        cp2.values = [
            { name: 'A', value: 2 },
            { name: 'B', value: 2 },
            { name: 'C', value: 2 },
        ];

        dc.operands.left = every;
        dc.operator = DeciderCombinator.Operators.eq;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if everything == B, output everything
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 2 },
            { name: 'B', value: 2 },
            { name: 'C', value: 2 },
        ]);

        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.values).to.deep.equal([{ name: 'B', value: 2 }]);

        dc.operands.right = const1; // false

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.values).to.deep.equal([]);
    });

    it ('should handle a left hand operand of "any"', () => {
        dc.operands.left = any;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if anything > B, output everything
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);

        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if anything > B, output B
        expect(dc.values).to.deep.equal([{ name: 'B', value: 2 }]);

        dc.operands.right = const100;
        dc.operands.output = every;

        dc.tick();
        dc.tock();
        // if anything > 100, output everything
        expect(dc.values).to.deep.equal([]);
    });

    it ('should handle a left hand operand of "each"', () => {
        dc.operands.left = { type: OperandType.Each };
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = { type: OperandType.Signal, name: 'B' };
        dc.operands.output = { type: OperandType.Each };

        dc.tick();
        dc.tock();

        // if each > B, output each
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if each > B, output the sum of the matches as B
        expect(dc.values).to.deep.equal([{ name: 'B', value: 16 }]);
    });

    it ('should transform all outputs to = 1 when required', () => {
        dc.operands.left = each;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = each;
        dc.outputOne = true;

        dc.tick();
        dc.tock();

        // if each > B, output each matching signal as = 1
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 1 },
            { name: 'C', value: 1 },
            { name: 'D', value: 1 },
        ]);

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if each > B, output the sum of them after they've been transformed to 1
        expect(dc.values).to.deep.equal([{ name: 'B', value: 3 }]);
    });

    it ('should throw errors when invalid left-hand operands are provided', () => {
        dc.operands.left = const100;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        // Constants cannot be left-hand operands
        dc.tick();
        expect(() => dc.tock()).to.throw();
    });

    it ('should throw errors when invalid right-hand operands are provided', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = each;
        dc.operands.output = sigB;

        // Each cannot be a right-hand operand
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.right = any;

        // Any cannot be a right-hand operand
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.right = every;

        // Every cannot be a right-hand operand
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.left = sigA;
        dc.operands.right = const1;
        dc.operands.output = sigA;

        // ensure combinator resumes normal action when conditions are valid
        dc.tick();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.deep.equal([{ name: 'A', value: 5 }]);
    });

    it ('should throw errors when invalid output operands are provided', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = each;

        // "Each" cannot be used as an output unless it is also used as an input
        expect(() => dc.tick()).to.throw(); // TODO: some IO errors throw on tick, some on tock. That is stupid

        dc.operands.left = each;
        dc.operands.right = const1;
        dc.operands.output = any;

        // "Any" cannot be used as an output with "Each" as a left-hand input
        expect(() => dc.tick()).to.throw(); // TODO: some IO errors throw on tick, some on tock. That is stupid

        dc.operands.output = every;

        // "Every" cannot be used as an output with "Each" as a left-hand input
        expect(() => dc.tick()).to.throw(); // TODO: some IO errors throw on tick, some on tock. That is stupid

        dc.operands.output = each;

        // ensure that it returns to normal when an acceptable output is used
        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);
    });

    it ('should sum common signals from multiple inputs and signals with value 0 should be removed', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);
    });

    it ('should behave predictably at every tick', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = every;

        // tick -1 - Initial state of outputs

        dc.tick();  // tick 0 - First calculation tick, output should still be 0
        dc.tock();  // tock 0 - Transfer tick calculation to outputs
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);

        // changing an input value should produce a proper result after one tick/tock
        cp2.values[0].value = 14;
        dc.tick();
        dc.tock();
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 15 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'D', value: 8 },
        ]);

        // changing an operand should produce a proper result after one tick/tock
        dc.operands.output = sigA;
        dc.tick();
        dc.tock();
        expect(dc.values).to.deep.equal([
            { name: 'A', value: 15 },
        ]);

        // changing an operator should produce a proper result after one tick/toc
        dc.operator = DeciderCombinator.Operators.lt;
        dc.tick();
        dc.tock();
        expect(dc.values).to.deep.equal([]);
    });

    it ('should play nice with others', () => {
        let dcReciever = new DeciderCombinator();

        let cdReciever = new Conduit();

        dcReciever.inputs.push(cdReciever);

        // link the output of dc to dcReciever
        cdReciever.providers.push(dc);

        dc.operands.left = each;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigC;
        dc.operands.output = each;

        dcReciever.operands.left = sigA;
        dcReciever.operator = DeciderCombinator.Operators.lt;
        dcReciever.operands.right = sigD;
        dcReciever.operands.output = sigD;

        dc.tick();
        dcReciever.tick();

        expect(dc.values).to.deep.equal([]);
        expect(dcReciever.values).to.deep.equal([]);

        dc.tock();
        dcReciever.tock();

        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'D', value: 8 },
        ]);

        dc.tick();
        dcReciever.tick();

        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'D', value: 8 },
        ]);
        expect(dcReciever.values).to.deep.equal([]);

        dc.tock();
        dcReciever.tock();

        expect(dc.values).to.deep.equal([
            { name: 'A', value: 5 },
            { name: 'D', value: 8 },
        ]);
        expect(dcReciever.values).to.deep.equal([
            {name: 'D', value: 8 },
        ]);
    });
});

describe ('Arithmetic Combinator', () => {
    let ac: ArithmeticCombinator;
    let cd1: Conduit;
    let cd2: Conduit;
    let cp1: ConduitProvider = { values: [] };
    let cp2: ConduitProvider = { values: [] };

    const sigA: Operand = { type: OperandType.Signal, name: 'A' };
    const sigB: Operand = { type: OperandType.Signal, name: 'B' };
    const sigC: Operand = { type: OperandType.Signal, name: 'C' };
    const sigD: Operand = { type: OperandType.Signal, name: 'D' };
    const sigE: Operand = { type: OperandType.Signal, name: 'E' };
    const sigF: Operand = { type: OperandType.Signal, name: 'F' };

    const const1: Operand = { type: OperandType.Constant, value: 1 };
    const const100: Operand = { type: OperandType.Constant, value: 100 };

    const any: Operand = { type: OperandType.Any };
    const each: Operand = { type: OperandType.Each };
    const every: Operand = { type: OperandType.Every };

    const empty: Operand = (<Operand>{});
    const noName: Operand = { type: OperandType.Signal };
    const noVal: Operand = { type: OperandType.Constant };

    beforeEach( () => {
        ac = new ArithmeticCombinator();

        cd1 = new Conduit();
        cd2 = new Conduit();

        cp1.values = [
            { name: 'A', value: 1 },
            { name: 'B', value: 2 },
            { name: 'C', value: 3 },
            { name: 'E', value: 11 },
        ];

        cp2.values = [
            { name: 'A', value: 4 },
            { name: 'D', value: 8 },
            { name: 'E', value: -11 },
            { name: 'F', value: -7 },
        ];

        cd1.providers.push(cp1);

        cd2.providers.push(cp2);

        ac.inputs.push(cd1, cd2);
    });

    it ('should return empty outputs when run in a default state', () => {
        let ac = new DeciderCombinator();

        expect(() => ac.tick()).not.to.throw();
        expect(() => ac.tock()).not.to.throw();
        expect(ac.values).to.be.empty;
    });

    it ('should return empty outputs when run with an empty operand', () => {
        // Left hand missing
        ac.operands.left = empty;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = sigB;
        ac.operands.output = sigB;

        expect(() => ac.tick()).not.to.throw();
        expect(() => ac.tock()).not.to.throw();
        expect(ac.values).to.deep.equal([]);

        // Right hand missing
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = empty;
        ac.operands.output = sigB;

        expect(() => ac.tick()).not.to.throw();
        expect(() => ac.tock()).not.to.throw();
        expect(ac.values).to.deep.equal([]);

        // Output missing
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = sigB;
        ac.operands.output = empty;

        expect(() => ac.tick()).not.to.throw();
        expect(() => ac.tock()).not.to.throw();
        expect(ac.values).to.deep.equal([]);
    });

    it ('should perform simple math operations', () => {
        // A opr B output B
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = sigB;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 7 }]);

        ac.operands.left = sigB;
        ac.operator = ArithmeticCombinator.Operators.subtract;
        ac.operands.right = sigC;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: -1 }]);

        ac.operands.left = sigB;
        ac.operator = ArithmeticCombinator.Operators.multiply;
        ac.operands.right = sigC;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 6 }]);

        ac.operands.left = sigD;
        ac.operator = ArithmeticCombinator.Operators.divide;
        ac.operands.right = sigB;
        ac.operands.output = sigD;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'D', value: 4 }]);

        ac.operands.right = sigA;

        ac.tick();
        ac.tock();

        // 8/5 = 1.6, should concatenate to 1
        expect(ac.values).to.deep.equal([{ name: 'D', value: 1 }]);

        ac.operands.left = sigF;

        ac.tick();
        ac.tock();

        // -7/5 = -1.4, should concatenate to -1
        expect(ac.values).to.deep.equal([{ name: 'D', value: -1 }]);

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.mod;
        ac.operands.right = sigC;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 2 }]);

        ac.operands.left = sigB;
        ac.operator = ArithmeticCombinator.Operators.leftShift;
        ac.operands.right = sigB;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 8 }]);

        ac.operands.left = sigB;
        ac.operator = ArithmeticCombinator.Operators.rightShift;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 1 }]);

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.and;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 1 }]);

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.or;
        ac.operands.right = sigB;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 7 }]);

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.xor;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 4 }]);
    });

    it ('should handle an input type of each', () => {
        ac.operands.left = each;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = each;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 6 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);

        ac.operands.output = sigA;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 16 },
        ]);
    });

    it ('should throw errors with invalid left-hand types', () => {
        ac.operands.left = every;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();

        ac.operands.left = any;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();

        ac.operands.left = const1;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();
    });

    it ('should throw errors with invalid right-hand types', () => {
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = each;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = every;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = any;
        ac.operands.output = sigB;

        ac.tick();
        expect(() => ac.tock()).to.throw();
    });

    it ('should throw errors with invalid output types', () => {
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = const1;

        expect(() => ac.tick()).to.throw();

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = every;

        expect(() => ac.tick()).to.throw();

        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = any;

        expect(() => ac.tick()).to.throw();

        // "each" not supported output without left hand each
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = each;

        expect(() => ac.tick()).to.throw();
    });

    it ('should return treat "signal" input operands with no name as having a value of 0', () => {

        // "Signal" types should include names
        ac.operands.left = noName;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = sigB;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 2 }]);

        ac.operands.left = sigB;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = noName;
        ac.operands.output = sigB;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'B', value: 2}]);
    });

    it ('should treat "constant" input operands with no value as having a value of 0', () => {

        // "Signal" types should include names
        ac.operands.left = sigA;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = noVal;
        ac.operands.output = sigA;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([{ name: 'A', value: 5 }]);
    });

    it ('signal results with value 0 should be removed', () => {
        cp2.values = [];

        ac.operands.left = each;
        ac.operator = ArithmeticCombinator.Operators.subtract;
        ac.operands.right = const1;
        ac.operands.output = each;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([
            { name: 'B', value: 1 },
            { name: 'C', value: 2 },
            { name: 'E', value: 10 },
        ]);
    });

    it ('should behave predictably at every tick', () => {
        ac.operands.left = each;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = each;

        // tick -1 - Initial state of outputs
        expect(ac.values).to.deep.equal([]);

        ac.tick();  // tick 0 - First calculation tick, output should still be 0
        ac.tock();  // tock 0 - Transfer tick calculation to outputs

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 6 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);

        // changing an input value should produce a proper result after one tick/tock
        cp2.values[0].value = 14;

        ac.tick();
        ac.tock();
        expect(ac.values).to.deep.equal([
            { name: 'A', value: 16 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);

        // changing an operand should produce a proper result after one tick/tock
        ac.operands.output = sigA;
        ac.tick();
        ac.tock();
        expect(ac.values).to.deep.equal([
            { name: 'A', value: 26 },
        ]);

        // changing an operator should produce a proper result after one tick/toc
        ac.operator = ArithmeticCombinator.Operators.multiply;

        ac.tick();
        ac.tock();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 21 },
        ]);
    });

    it ('should play nice with others', () => {
        let dcReciever = new DeciderCombinator();

        let cdReciever = new Conduit();

        dcReciever.inputs.push(cdReciever);

        // link the output of ac to dcReciever
        cdReciever.providers.push(ac);

        ac.operands.left = each;
        ac.operator = ArithmeticCombinator.Operators.add;
        ac.operands.right = const1;
        ac.operands.output = each;

        dcReciever.operands.left = sigA;
        dcReciever.operator = DeciderCombinator.Operators.lt;
        dcReciever.operands.right = sigD;
        dcReciever.operands.output = sigD;

        ac.tick();
        dcReciever.tick();

        expect(ac.values).to.deep.equal([]);
        expect(dcReciever.values).to.deep.equal([]);

        ac.tock();
        dcReciever.tock();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 6 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);

        ac.tick();
        dcReciever.tick();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 6 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);
        expect(dcReciever.values).to.deep.equal([]);

        ac.tock();
        dcReciever.tock();

        expect(ac.values).to.deep.equal([
            { name: 'A', value: 6 },
            { name: 'B', value: 3 },
            { name: 'C', value: 4 },
            { name: 'D', value: 9 },
            { name: 'F', value: -6 },
        ]);
        expect(dcReciever.values).to.deep.equal([
            {name: 'D', value: 9 },
        ]);
    });
});
