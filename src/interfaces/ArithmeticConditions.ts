import { SignalID } from './SignalID';

export interface ArithmeticConditions {
    first_signal?: SignalID;
    second_signal?: SignalID;
    constant?: number;
    operation?: string;
    output_signal?: SignalID;
}