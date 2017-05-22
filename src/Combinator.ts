export default class Combinator {

    public inputArray: Conduit[];

    private get _inputs(): Conduit {
        let result: Conduit = Object.assign({}, ...this.inputArray);

        for(let key in result) {
            result[key] = 0;
        }

        for(let input of this.inputArray) {
            for(let key in input) {
                result[key] += input[key]
            }
        }

        return result;
    }

    constructor() {
        this.inputArray = [];
    }

    dostuff(): void {
       console.log(this._inputs);
    }

}

let testone = new Combinator();


testone.inputArray.push({ A: 2, B: 3, D: 2, yellow: 3 });
testone.inputArray.push({ A: 2, B: 5, C: 4});

testone.dostuff()

interface Signal {
    name: string;
    value: number;
}

interface Conduit {
    [signalName: string]: number;
}
