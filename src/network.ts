import { lerp } from "./utils";

export class NNetwork {
    levels: Level[];
    constructor(neuronCounts: number[]) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(
                new Level(
                    neuronCounts[i],
                    neuronCounts[i + 1]
                ))
        }
    }

    static feedForward(inputs: number[], network: NNetwork) {
        let outputs = Level.feedForward(inputs, network.levels[0]);

        for (let i = 1; i < network.levels.length; i++) {
            outputs = Level.feedForward(outputs, network.levels[i]);
        }

        return outputs;
    }

    static mutate(network: NNetwork, amount = 1) {
        for (const level of network.levels) {
            for (let i = 0; i < level.biases.length; i++) {
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random() * 2 - 1,
                    amount
                );
            }

            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++)
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random() * 2 - 1,
                        amount
                    );
            }
        }
    }
}


export class Level {
    inputs: number[];
    outputs: number[];
    biases: number[];
    weights: number[][];
    constructor(inputSize: number, outputSize: number) {
        this.inputs = new Array<number>(inputSize);
        this.outputs = new Array<number>(outputSize);
        this.biases = new Array<number>(outputSize);

        this.weights = [];

        for (let i = 0; i < inputSize; i++) {
            this.weights[i] = new Array(outputSize);
        }

        Level.randomize(this);
    }

    static randomize(level: Level) {
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }
        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    static feedForward(inputs: number[], level: Level) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = inputs[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;

            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }
            if (sum > level.biases[i]) {
                level.outputs[i] = 1;
            } else {
                level.outputs[i] = 0;
            }
        }

        return level.outputs;
    }

}