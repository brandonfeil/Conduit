/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { OperandType }          from '../src/interfaces/OperandType';
import { Operand }              from '../src/interfaces/Operand';
import { ConduitInput }         from '../src/interfaces/ConduitInput';

// Classes and Modules
import { expect }               from 'chai';
import { DeciderCombinator }    from '../src/Combinator';
import { Conduit }              from '../src/Conduit';

describe('Decider Combinator', () => {
    let dc: DeciderCombinator;
    let cd1: Conduit;
    let cd2: Conduit;
    let ci1: ConduitInput = { output: {} };
    let ci2: ConduitInput = { output: {} };

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

        // Merged input { A: 5, B: 2, C: 3, D: 8 }
        ci1.output = { A: 1, B: 2, C: 3, E: 11 };
        ci2.output = { A: 4, D: 8, E: -11 };

        cd1.inputs.push(ci1);
        cd2.inputs.push(ci2);

        dc.inputs.push(cd1, cd2);
    });

    it('should return empty outputs when run in a default state', () => {
        let dc = new DeciderCombinator();

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.be.empty;
    });

    it('should return empty outputs when run with an empty operand', () => {
        // Left hand missing
        dc.operands.left = empty;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        // Right hand missing
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = empty;
        dc.operands.output = sigB;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        // Output missing
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = empty;

        expect(() => dc.tick()).not.to.throw();
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});
    });

    it('should perform simple comparisons', () => {
        ci1.output = {};
        ci2.output = {A: 3, B: 2, C: 2, D: 1};

        // A opr B output B
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.gte;
        dc.operands.right = sigC;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.lte;
        dc.operands.right = sigC;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});

        dc.operands.left = sigD;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = sigC;
        dc.operands.output = sigD;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({D: 1});

        dc.operands.left = sigC;
        dc.operator = DeciderCombinator.Operators.eq;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});

        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.neq;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});
    });

    it('should treat "Signal" input operands with no name as having a value of 0', () => {

        // "Signal" types should include names
        dc.operands.left = noName;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});

        dc.operands.left = sigB;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = noName;
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});
    });

    it('should treat "constant" input operands with no value as having a value of 0', () => {

        // "Signal" types should include names
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = noVal;
        dc.operands.output = sigA;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({A: 5});

        ci1.output.A = 0;
        ci2.output.A = -5;

        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.lt;
        dc.operands.right = noVal;
        dc.operands.output = sigA;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({A: -5});
    });

    it('should handle an output type of "every"', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if A > B, output everything
        expect(dc.output).to.deep.equal({ A: 5, B: 2, C: 3, D: 8 });
    });

    it('should handle a left hand operand of "every"', () => {
        ci1.output = {};
        ci2.output = {A: 2, B: 2, C: 2};

        dc.operands.left = every;
        dc.operator = DeciderCombinator.Operators.eq;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if everything == B, output everything
        expect(dc.output).to.deep.equal({A: 2, B: 2, C: 2});

        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.output).to.deep.equal({ B: 2 });

        dc.operands.right = const1;

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.output).to.deep.equal({});
    });

    it('should handle a left hand operand of "any"', () => {
        dc.operands.left = any;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        // if anything > B, output everything
        expect(dc.output).to.deep.equal({A: 5, B: 2, C: 3, D: 8});

        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if anything > B, output B
        expect(dc.output).to.deep.equal({ B: 2 });

        dc.operands.right = const100;
        dc.operands.output = every;

        dc.tick();
        dc.tock();
        // if anything > 100, output everything
        expect(dc.output).to.deep.equal({});
    });

    it('should handle a left hand operand of "each"', () => {
        dc.operands.left = { type: OperandType.Each };
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = { type: OperandType.Signal, name: 'B' };
        dc.operands.output = { type: OperandType.Each };

        dc.tick();
        dc.tock();

        // if each > B, output each
        expect(dc.output).to.deep.equal({ A: 5, C: 3, D: 8 });

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if each > B, output the sum of the matches as B
        expect(dc.output).to.deep.equal({ B: 16 });
    });

    it('should transform all outputs to = 1 when required', () => {
        dc.operands.left = each;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = each;
        dc.outputOne = true;

        dc.tick();
        dc.tock();

        // if each > B, output each matching signal as = 1
        expect(dc.output).to.deep.equal({ A: 1, C: 1, D: 1});

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = sigB;

        dc.tick();
        dc.tock();

        // if each > B, output the sum of them on B, but transform it to 1
        expect(dc.output).to.deep.equal({ B: 1 });
    });

    it('should throw errors when invalid left-hand operands are provided', () => {
        dc.operands.left = const100;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = sigB;
        dc.operands.output = sigB;

        // Constants cannot be left-hand operands
        expect(() => dc.tick()).to.throw();
    });

    it('should throw errors when invalid right-hand operands are provided', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = each;
        dc.operands.output = sigB;

        // Each cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();

        dc.operands.right = any;

        // Any cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();

        dc.operands.right = every;

        // Every cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();

        dc.operands.left = sigA;
        dc.operands.right = const1;
        dc.operands.output = sigA;

        // ensure combinator resumes normal action when conditions are valid
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({A: 5});
    });

    it('should throw errors when invalid output operands are provided', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = each;

        // "Each" cannot be used as an output unless it is also used as an input
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.left = each;
        dc.operands.right = const1;
        dc.operands.output = any;

        // "Any" cannot be used as an output with "Each" as a left-hand input
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.output = every;

        // "Every" cannot be used as an output with "Each" as a left-hand input
        dc.tick();
        expect(() => dc.tock()).to.throw();

        dc.operands.output = each;

        // ensure that it returns to normal when an acceptable output is used
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({A: 5, B: 2, C: 3, D: 8});
    });

    it('should sum common signals from multiple inputs and signals with value 0 should be removed', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = every;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({A: 5, B: 2, C: 3, D: 8});
    });

    it('should behave predictably at every tick', () => {
        dc.operands.left = sigA;
        dc.operator = DeciderCombinator.Operators.gt;
        dc.operands.right = const1;
        dc.operands.output = every;

        // tick -1 - Initial state of outputs
        expect(dc.output).to.deep.equal({});

        dc.tick();  // tick 0 - First calculation tick, output should still be 0
        expect(dc.output).to.deep.equal({});
        dc.tock();  // tock 0 - Transfer tick calculation to outputs
        expect(dc.output).to.deep.equal({A: 5, B: 2, C: 3, D: 8});

        // changing an input value should produce a proper result after one tick/tock
        ci2.output.A = 14;
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal({A: 15, B: 2, C: 3, D: 8});

        // changing an operand should produce a proper result after one tick/tock
        dc.operands.output = sigA;
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal({A: 15});

        // changing an operator should produce a proper result after one tick/toc
        dc.operator = DeciderCombinator.Operators.lt;
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal({});
    });

    it('should play nice with others', () => {
        let dcReciever = new DeciderCombinator();

        let cdReciever = new Conduit();

        dcReciever.inputs.push(cdReciever);

        // link the output of dc to dcReciever
        cdReciever.inputs.push(dc);

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

        expect(dc.output).to.deep.equal({});
        expect(dcReciever.output).to.deep.equal({});

        dc.tock();
        dcReciever.tock();

        expect(dc.output).to.deep.equal({A: 5, D: 8});

        dc.tick();
        dcReciever.tick();

        expect(dc.output).to.deep.equal({A: 5, D: 8});
        expect(dcReciever.output).to.deep.equal({});

        dc.tock();
        dcReciever.tock();

        expect(dc.output).to.deep.equal({A: 5, D: 8});
        expect(dcReciever.output).to.deep.equal({D: 8});
    });
});
