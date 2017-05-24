/// <reference types="mocha" />
/// <reference types="chai" />

// Interfaces
import { ConduitInput }    from "../src/interfaces/ConduitInput";

// Classes and Modules
import { expect }               from "chai";
import { Conduit }              from "../src/Conduit";

describe("Conduit", () => {
    let cd: Conduit; 
    let ci1: ConduitInput = { output: {} };
    let ci2: ConduitInput = { output: {} };

    beforeEach( () => {
        cd = new Conduit(); 

        ci1.output = { A: 1, B: 2, C: 3 };
        ci2.output = { A: 4, D: 8 };

        cd.inputs.push(ci1);
        cd.inputs.push(ci2);

    });

    it("should return an empty object in its default state", () => {
        cd = new Conduit();

        expect(cd.value).to.deep.equal({});
    })
    
    it("should return an empty object if its sources are empty", () => {
        ci1.output = {};
        ci2.output = {};

        expect(cd.value).to.deep.equal({}); 
    });
    
    it("should merge given input SignalCollections into one", () => {
        expect(cd.value).to.deep.equal({ A: 5, B: 2, C: 3, D: 8 }); 
    });

    it("should remove signals with a value of 0 from its output", () => {
        ci1.output = { A: 5 };
        ci2.output = { A: -5 };

        expect(cd.value).to.deep.equal({});
    });
});