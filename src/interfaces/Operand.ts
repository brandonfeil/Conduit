import { OperandType } from "./OperandType"

export interface Operand {
    type: OperandType;
    value?: number;
    name?: string;
}