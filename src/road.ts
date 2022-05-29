import { lerp } from "./utils";

const BORDER_COLOR = "#f7ac08";
const LANE_COLOR = "white";

export class Road {
    left: number;
    right: number;
    top: number;
    bottom: number;
    borders: { x: number; y: number; }[][];
    constructor(private x: number, private width: number, private laneCount = 3) {
        this.left = this.x - this.width / 2;
        this.right = this.x + this.width / 2;

        const infinity = 10000000;

        this.top = -infinity;
        this.bottom = infinity;

        const topLeft = { x: this.left, y: this.top };
        const topRight = { x: this.right, y: this.top };
        const bottomLeft = { x: this.left, y: this.bottom };
        const bottomRight = { x: this.right, y: this.bottom };

        this.borders = [
            [topLeft, bottomLeft],
            [topRight, bottomRight]];
    }

    getLineCenter(laneIndex: number) {
        const lineWidth = this.width / this.laneCount;
        return this.left + lineWidth / 2 + laneIndex * lineWidth;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 5;

        for (let i = 1; i <= this.laneCount - 1; i++) {
            const x = lerp(
                this.left,
                this.right,
                i / this.laneCount
            )
            ctx.strokeStyle = LANE_COLOR;
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(x, this.top);
            ctx.lineTo(x, this.bottom);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const border of this.borders) {

            ctx.strokeStyle = BORDER_COLOR;
            ctx.beginPath();
            ctx.moveTo(border[0].x, border[0].y);
            ctx.lineTo(border[1].x, border[1].y);
            ctx.stroke();
        }
    }
}

