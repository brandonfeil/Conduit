/// <reference types="mocha" />
/// <reference types="chai" />

import { expect } from "chai"
import Startup from "../src/test";

describe("Startup main()", () => {
    it("should return 0", () => {
        expect(Startup.main()).to.equal(0);
    })
})