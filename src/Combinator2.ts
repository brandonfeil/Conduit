import { Signal } from './interfaces/Signal';
import { SignalID } from './interfaces/SignalID';
import { SignalValueProvider } from './interfaces/SignalValueProvider';
import { SignalType } from './interfaces/SignalType';
import { Clockable } from './interfaces/Clockable';
import { DeciderConditions } from './interfaces/DeciderConditions';
import { ComparisonFunction } from './interfaces/ComparisonFunction';

import { Circuit } from './Circuit';
import * as _ from 'lodash';

abstract class Combinator implements SignalValueProvider, Clockable {
    // Properties --------------------------------------------------
    // Public
    public connections: SignalValueProvider[];
    public control_behavior: any;
    public signals: Signal[];
    public abstract get valid(): boolean;

    // Methods --------------------------------------------------
    public abstract tick(): void;
    public abstract tock(): void;

    // Constructor --------------------------------------------------
    constructor () {
        this.connections = [];
        this.control_behavior = {};
        this.signals = [];
    }
}

const DeciderOperators: { [funcName: string]: ComparisonFunction } = {
    '<': (L: number, R: number): boolean => {
        return (L < R);
    },
    '>': (L: number, R: number): boolean => {
        return (L > R);
    },
    '≤': (L: number, R: number): boolean => {
        return (L <= R);
    },
    '≥': (L: number, R: number): boolean => {
        return (L >= R);
    },
    '=': (L: number, R: number): boolean => {
        return (L === R);
    },
    '≠': (L: number, R: number): boolean => {
        return (L !== R);
    },
};

export class DeciderCombinator extends Combinator {
    // Properties --------------------------------------------------
    // Public
    public static Comparators = DeciderOperators;

    public control_behavior: DeciderConditions;

    public get valid (): boolean {
        // enforce all rules determining whether or not this is a valid set of inputs
        if (this.control_behavior === undefined) {
            return false;
        }

        if (this.control_behavior.copy_count_from_input === undefined) {
            return false;
        }

        // left-hand value
        if (this.control_behavior.first_signal === undefined) {
                return false;
        }

        // right-hand value
        if ((this.control_behavior.second_signal === undefined && this.control_behavior.constant === undefined)
            || (this.control_behavior.second_signal !== undefined && this.control_behavior.second_signal.name === 'signal-each')
            || (this.control_behavior.second_signal !== undefined && this.control_behavior.second_signal.name === 'signal-everything')
            || (this.control_behavior.second_signal !== undefined && this.control_behavior.second_signal.name === 'signal-anything')) {
                return false;
        }

        // comparator
        if (this.control_behavior.comparator === undefined
            || !_.has(DeciderCombinator.Comparators, this.control_behavior.comparator)) {
            return false;
        }

        // output value
        if (this.control_behavior.output_signal === undefined
            || this.control_behavior.output_signal.name === 'signal-anything'
            || (this.control_behavior.output_signal.name === 'signal-each' && this.control_behavior.first_signal.name !== 'signal-each')
            || (this.control_behavior.output_signal.name === 'signal-everything' && this.control_behavior.first_signal.name === 'signal-each')) {
            return false;
        }

        return true;
    }

    // Private
    public _snapshot: {
        valid: boolean,
        input_signals?: Signal[];
        first_signal?: SignalID;
        second_signal?: SignalID;
        constant?: number;
        comparator?: string;
        output_signal?: SignalID;
        copy_count_from_input?: boolean;
    };

    // Methods --------------------------------------------------
    public tick(): void {
        if (!this.valid) {
            this._snapshot = { valid: false };
            return;
        }

        // capture state
        this._snapshot.valid = true;
        this._snapshot.first_signal = _.cloneDeep(this.control_behavior.first_signal);
        this._snapshot.second_signal = _.cloneDeep(this.control_behavior.second_signal);
        this._snapshot.output_signal = _.cloneDeep(this.control_behavior.output_signal);
        this._snapshot.constant = this.control_behavior.constant;
        this._snapshot.comparator = this.control_behavior.comparator;
        this._snapshot.copy_count_from_input = this.control_behavior.copy_count_from_input;

        // save input signal state
        let merger = new Circuit();

        merger.providers = this.connections;

        this._snapshot.input_signals = _.cloneDeep(merger.signals);
    }

    public tock(): void {
        if (!this._snapshot.valid) {
            this.signals = [];
            return;
        }

        let results: Signal[] = [];
        let success = false;

        let rhv: number;

        if (this._snapshot.second_signal !== undefined) {
            let rhv_signal = _.find(this._snapshot.input_signals, ['signal.name', this._snapshot.second_signal.name]);

            rhv = rhv_signal !== undefined ? rhv_signal.count : 0;
        }
        else {
            rhv = this._snapshot.constant;
        }

        // perform comparisons
        switch (this._snapshot.first_signal.name) {
            case('signal-anything'): {
                for (let signal of this._snapshot.input_signals) {
                    if (DeciderCombinator.Comparators[this._snapshot.comparator](signal.count, rhv)) {
                        results = this._snapshot.input_signals;
                        success = true;
                        break;
                    }
                }
                break;
            }
            case('signal-everything'): {
                success = true;

                for (let signal of this._snapshot.input_signals) {
                    if (!DeciderCombinator.Comparators[this._snapshot.comparator](signal.count, rhv)) {
                        success = false;
                        break;
                    }
                }

                if (success) {
                    results = this._snapshot.input_signals;
                }
                break;
            }
            case('signal-each'): {
                for (let signal of this._snapshot.input_signals) {
                    if (DeciderCombinator.Comparators[this._snapshot.comparator](signal.count, rhv)) {
                        results.push(signal);
                        success = true;
                    }
                }
                break;
            }
            default: {
                let lhv_signal: Signal;

                lhv_signal = _.find(this._snapshot.input_signals, ['signal.name', this._snapshot.first_signal.name]); /*?*/

                // treat missing signals as having a value of 0
                if (lhv_signal === undefined) {
                    lhv_signal = { signal: this._snapshot.first_signal, count: 0 };
                }

                if (DeciderCombinator.Comparators[this._snapshot.comparator](lhv_signal.count, rhv)) {
                    results = this._snapshot.input_signals;
                    success = true;
                }
            }
        }

        // transform results to 1 if necessary
        if (this._snapshot.copy_count_from_input === false) {
            results = results.map( (result) => {
                result.count = 1;
                return result;
            });
        }

        // filter results
        switch (this._snapshot.output_signal.name) {
            case('signal-each'):
            case('signal-everything'): {
                break;
            }
            default: {
                if (this._snapshot.first_signal.name === 'signal-each') {
                    let value: number = results.reduce( (acc, result) => {
                        return acc + result.count;
                    }, 0);

                    results = [{
                        signal: this._snapshot.output_signal,
                        count: value,
                    }];
                }
                else if (this._snapshot.copy_count_from_input === false && success) {
                    results = [{
                        signal: this._snapshot.output_signal,
                        count: 1,
                    }];
                }
                else {
                   let result_signal: Signal;

                   result_signal = _.find(results, ['signal.name', this._snapshot.output_signal.name]);

                   results = result_signal !== undefined ? [result_signal] : [];
                }
            }
        }

        this.signals = results;
    }

    // Constructor --------------------------------------------------
    constructor () {
        super();
        this._snapshot = { valid: false };
    }
}
