import { NNetwork } from "./network";

export interface Control {
    forward: boolean;
    reverse: boolean;
    left: boolean;
    right: boolean;
}

export class StaticControl implements Control {
    forward: boolean = false;
    reverse: boolean = false;
    left: boolean = false;
    right: boolean = false;
}

export class KeyControls implements Control {
    forward: boolean;
    left: boolean;
    right: boolean;
    reverse: boolean;
    constructor() {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;

        this.addKeyboardListeners();
    }

    private addKeyboardListeners() {
        document.onkeydown = (event) => {
            switch (event.key) {
                case "ArrowLeft":
                    this.left = true;
                    break;
                case "ArrowRight":
                    this.right = true;
                    break;
                case "ArrowUp":
                    this.forward = true;
                    break;
                case "ArrowDown":
                    this.reverse = true;
                    break;
                default:
                    break;
            }
        };

        document.onkeyup = (event) => {
            switch (event.key) {
                case "ArrowLeft":
                    this.left = false;
                    break;
                case "ArrowRight":
                    this.right = false;
                    break;
                case "ArrowUp":
                    this.forward = false;
                    break;
                case "ArrowDown":
                    this.reverse = false;
                    break;
                default:
                    break;
            }
        };
    }
}

export class AlwaysForwardControls implements Control {
    forward: boolean;
    left: boolean;
    right: boolean;
    reverse: boolean;
    constructor() {
        this.forward = true;
        this.left = false;
        this.right = false;
        this.reverse = false;
    }
}

export class NNControl implements Control {
    forward: boolean;
    left: boolean;
    right: boolean;
    reverse: boolean;
    constructor(public ai: NNetwork) {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;
    }

    update(offsets: number[]) {
        // const offsets = this.sensor.readings.map(s =>
        //     s == null ? 0 : 1 - s.offset);

        const outputs = NNetwork.feedForward(offsets, this.ai);
        this.forward = outputs[0] > 0;
        this.left = outputs[1] > 0;
        this.right = outputs[2] > 0;
        this.reverse = outputs[3] > 0;
    }
}