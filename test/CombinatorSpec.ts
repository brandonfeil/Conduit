
/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { OperandType }          from "../src/interfaces/OperandType";

// Classes and Modules
import { expect }               from "chai";
import { DeciderCombinator }    from "../src/Combinator";
import { Conduit }              from "../src/Conduit";

describe("Decider Combinator", () => {
    it("should return empty outputs when run in a default state", () => {
        let dc = new DeciderCombinator();
        
        // tick twice as outputs are one tick behind the first calculation
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});
    });
    it("should return empty outputs when run with an empty operand", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({output: { A: 3, B: 2, C: 3 }});
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.gt;

        // Left hand missing
        dc.operands.left = {};
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Signal, name: "B" };
        
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        // Right hand missing
        dc.operands.left = { type: OperandType.Signal, name: "B" };
        dc.operands.right = {};
        dc.operands.output = { type: OperandType.Signal, name: "B" };
        
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});
        
        // Output missing
        dc.operands.left = { type: OperandType.Signal, name: "B" };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = {};
        
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});

        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({});
    });
    it("should treat 'Signal' input operands with no name as having a value of 0", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.lt;

        // "Signal" types should include names
        dc.operands.left = { type: OperandType.Signal  };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});
        
        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Signal , name: "B" };
        dc.operands.right = { type: OperandType.Signal };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});
    });
    it("should treat 'constant' input operands with no value as having a value of 0", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: -3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.lt;

        // "Signal" types should include names
        dc.operands.left = { type: OperandType.Signal, name: "A"  };
        dc.operands.right = { type: OperandType.Constant };
        dc.operands.output = { type: OperandType.Signal, name: "A" };

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({A: -3});
        
        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Signal , name: "B" };
        dc.operands.right = { type: OperandType.Constant };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 2});
    });
    it("should perform simple comparisons", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        // A opr B output B
        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Signal, name: "B" };
        
        // gt | A(3) > B(2) output B(2)
        dc.operator = DeciderCombinator.Operators.gt;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B:2});

        // gte | A(3) >= B(2) output B(2)
        dc.operator = DeciderCombinator.Operators.gte;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B:2});
        
        // lt | A(3) < B(2) output B(false)
        dc.operator = DeciderCombinator.Operators.lt;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({});

        // lte | A(3) < B(2) output B(false)
        dc.operator = DeciderCombinator.Operators.lte;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({});

        // neq | A(3) !== B(2) output B(2)
        dc.operator = DeciderCombinator.Operators.neq;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B:2});

        // eq | A(3) === B(2) output B(false)
        dc.operator = DeciderCombinator.Operators.eq;

        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({});
    });
    it("should handle an output type of 'every'", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        // A opr B output B
        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Every };

        dc.operator = DeciderCombinator.Operators.gt;

        dc.tick();
        dc.tock();

        // if A > B, output everything
        expect(dc.output).to.deep.equal(conduit.value);
    });
    it("should handle a left hand operand of 'every'", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 2, 
                B: 2, 
                C: 2 
            }
        });
        
        dc.inputs.push(conduit);

        // A opr B output B
        dc.operands.left = { type: OperandType.Every, };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Every };

        dc.operator = DeciderCombinator.Operators.eq;

        dc.tick();
        dc.tock();
        
        // if everything == B, output everything
        expect(dc.output).to.deep.equal(conduit.value);

        dc.operands.output = { type: OperandType.Signal, name: "B"};

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.output).to.deep.equal({ B: 2 });

        dc.operands.right = { type: OperandType.Constant, value: 3 };

        dc.tick();
        dc.tock();

        // if everything == B, output B
        expect(dc.output).to.deep.equal({});
    });
    it("should handle a left hand operand of 'any'", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 2, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        // A opr B output B
        dc.operands.left = { type: OperandType.Any, };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Every };

        dc.operator = DeciderCombinator.Operators.gt;

        dc.tick();
        dc.tock();

        // if anything > B, output everything
        expect(dc.output).to.deep.equal(conduit.value);

        dc.operands.output = { type: OperandType.Signal, name: "B"};

        dc.tick();
        dc.tock();

        // if anything > B, output B
        expect(dc.output).to.deep.equal({ B: 2 });

        dc.operands.left = { type: OperandType.Any };
        dc.operands.right = { type: OperandType.Constant, value: 1000};
        dc.operands.output = { type: OperandType.Every };
        
        dc.tick();
        dc.tock();
        // if anything > 1000, output everything
        expect(dc.output).to.deep.equal({});
    });
    it("should handle a left hand operand of 'each'", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        // A opr B output B
        dc.operands.left = { type: OperandType.Each, };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Each };

        dc.operator = DeciderCombinator.Operators.gt;

        dc.tick();
        dc.tock();

        // if each > B, output each
        expect(dc.output).to.deep.equal({ A: 3, C: 3 });

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = { type: OperandType.Signal, name: "B"};

        dc.tick();
        dc.tock();

        // if each > B, output the sum of the matches as B
        expect(dc.output).to.deep.equal({ B: 6 });
    });
    it("should transform all outputs to = 1 when required", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.outputOne = true;

        // A opr B output B
        dc.operands.left = { type: OperandType.Each, };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Each };

        dc.operator = DeciderCombinator.Operators.gt;

        dc.tick();
        dc.tock();

        // if each > B, output each matching signal as = 1
        expect(dc.output).to.deep.equal({ A: 1, C: 1 });

        // when using each as an input, an output of type Signal adds all matching results together and outputs as signal
        dc.operands.output = { type: OperandType.Signal, name: "B"};

        dc.tick();
        dc.tock();

        // if each > B, output the sum of them on B, but transform it to 1
        expect(dc.output).to.deep.equal({ B: 1 });
    });
    it("should throw errors when invalid left-hand operands are provided", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 2, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Constant, value: 30 };
        dc.operands.right = { type: OperandType.Signal, name: "B" };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        // Constants cannot be left-hand operands
        expect(() => dc.tick()).to.throw();
    });
    it("should throw errors when invalid right-hand operands are provided", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Each };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        // Each cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Any };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        // Any cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Every };
        dc.operands.output = { type: OperandType.Signal, name: "B" };

        // Every cannot be a right-hand operand
        expect(() => dc.tick()).to.throw();
        
        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Constant, value: 1 };
        dc.operands.output = { type: OperandType.Signal, name: "A" };
        
        // ensure combinator resumes normal action when conditions are valid
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal({A: 3});
    });
    it("should throw errors when invalid output operands are provided", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        conduit.inputs.push({
            output: { 
                A: 2, 
                B: 2, 
                C: 3 
            }
        });
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Constant, value: 1};
        dc.operands.output = { type: OperandType.Each  };

        // "Each" cannot be used as an output unless it is also used as an input
        expect(() => dc.tick()).to.throw();

        dc.operands.left = { type: OperandType.Each };
        dc.operands.right = { type: OperandType.Constant, value: 1 };
        dc.operands.output = { type: OperandType.Any };

        // "Any" cannot be used as an output with "Each" as a left-hand input
        expect(() => dc.tick()).to.throw();

        dc.operands.output = { type: OperandType.Every };

        // "Every" cannot be used as an output with "Each" as a left-hand input
        expect(() => dc.tick()).to.throw();

        dc.operands.output = { type: OperandType.Each };

        // ensure that it returns to normal when an acceptable output is used
        expect(() => dc.tick()).not.to.throw();
        expect(dc.output).to.deep.equal({});
        expect(() => dc.tock()).not.to.throw();
        expect(dc.output).to.deep.equal(conduit.value);
    });
    it("should sum common signals from multiple inputs and signals with value 0 should be removed", () => {
        let dc = new DeciderCombinator();
        let conduit1 = new Conduit();
        let conduit2 = new Conduit();

        conduit1.inputs.push({
             output: {
                 A: 3, 
                 B: 2, 
                 C: 3 
             }
        });
        conduit2.inputs.push({
             output: {
                 A: -3, 
                 B: 2, 
                 C: 3 
             }
        });

        dc.inputs.push(conduit1);
        dc.inputs.push(conduit2);

        dc.operator = DeciderCombinator.Operators.lt;

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Constant, value: 1};
        dc.operands.output = { type: OperandType.Every  };
        
        dc.tick();
        dc.tock();

        expect(dc.output).to.deep.equal({B: 4, C: 6})
    });
    it("should behave predictably at every tick", () => {
        let dc = new DeciderCombinator();
        let conduit = new Conduit();

        let source = {
            output: { 
                A: 3, 
                B: 2, 
                C: 3 
            }
        }

        conduit.inputs.push(source);
        
        dc.inputs.push(conduit);

        dc.operator = DeciderCombinator.Operators.gt;

        dc.operands.left = { type: OperandType.Signal, name: "A" };
        dc.operands.right = { type: OperandType.Constant, value: 1};
        dc.operands.output = { type: OperandType.Every  };

        // tick -1 - Initial state of outputs
        expect(dc.output).to.deep.equal({});

        dc.tick();  // tick 0 - First calculation tick, output should still be 0
        expect(dc.output).to.deep.equal({});
        dc.tock();  // tock 0 - Transfer tick calculation to outputs
        expect(dc.output).to.deep.equal(conduit.value);
        
        // changing an input value should produce a proper result after one tick/tock
        source.output.A = 4
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal(conduit.value);

        // changing an operand should produce a proper result after one tick/tock
        dc.operands.output = { type: OperandType.Signal, name: "A" };
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal({A: 4});

        // changing an operator should produce a proper result after one tick/toc
        dc.operator = DeciderCombinator.Operators.lt;
        dc.tick();
        dc.tock();
        expect(dc.output).to.deep.equal({});
    });
    it("should play nice with others", () => {
        let dc1 = new DeciderCombinator();
        let dc2 = new DeciderCombinator();

        let in1 = {
            output: {
                A: 3, 
                B: 4
            }
        };
        let in2 = {
            output: {
                A: 1, 
                C: 3
            }
        };

        let conduit1 = new Conduit();
        let conduit2 = new Conduit();

        conduit1.inputs.push(in1);
        conduit2.inputs.push(in2);

        // link the output of dc1 to dc2
        conduit2.inputs.push(dc1);

        dc1.inputs.push(conduit1);
        dc2.inputs.push(conduit2);

        dc1.operands.left = { type: OperandType.Signal, name: "A" };
        dc1.operator = DeciderCombinator.Operators.lt;
        dc1.operands.right = { type: OperandType.Signal, name: "B" };
        dc1.operands.output = { type: OperandType.Signal, name: "A" };

        dc2.operands.left = { type: OperandType.Signal, name: "C" };
        dc2.operator = DeciderCombinator.Operators.lt;
        dc2.operands.right = { type: OperandType.Signal, name: "A" };
        dc2.operands.output = { type: OperandType.Every };
        
        dc1.tick();
        dc2.tick();

        expect(dc1.output).to.deep.equal({});
        expect(dc2.output).to.deep.equal({}); 

        dc1.tock();
        dc2.tock();

        expect(dc1.output).to.deep.equal({A: 3});

        dc1.tick();
        dc2.tick();

        expect(dc1.output).to.deep.equal({A: 3});
        expect(dc2.output).to.deep.equal({});

        dc1.tock();
        dc2.tock();

        expect(dc1.output).to.deep.equal({A: 3});
        expect(dc2.output).to.deep.equal({A: 4, C: 3});
    });
        

});