import { TestEnum } from "./interfaces/TestEnum"

export function tryIt(): TestEnum {
    let foo: TestEnum = TestEnum.This;

    console.log(foo);

    return (foo);


}