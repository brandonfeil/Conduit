import { SignalID } from './SignalID';

export interface DeciderConditions {
    first_signal?: SignalID;
    second_signal?: SignalID;
    constant?: number;
    comparator?: string;
    output_signal?: SignalID;
    copy_count_from_input?: boolean;
}
