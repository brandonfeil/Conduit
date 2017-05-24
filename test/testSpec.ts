/// <reference types="mocha" />
/// <reference types="chai" />

import { expect } from "chai"

import { TestEnum } from "../src/interfaces/TestEnum"
import { tryIt } from "../src/test"

describe("tryIt", () => {
    it("should do something", () => {
        expect(tryIt()).to.equal(TestEnum.This);
    })
})