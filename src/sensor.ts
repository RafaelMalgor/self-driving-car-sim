import { Car } from "./car";
import { getIntersection, Intersection, lerp, Point } from "./utils";

const SENSOR_COLOR = "#4BB46C";
const SHADOW_COLOR = "rgba(0, 0, 0, 0.1)";

export class Sensor {
    rayLength: number;
    raySpread: number;
    rays: { x: number, y: number }[][];
    readings: (Intersection | null)[];
    constructor(private car: Car, private rayCount = 5) {

        this.rayLength = 350;
        this.raySpread = Math.PI / 5;
        this.rays = [];
        this.readings = [];
    }

    update(roadBorder: Point[][], traffic: Car[]) {
        this.castSensorRays();
        this.readings = [];

        for (const ray of this.rays) {
            this.readings.push(this.getReading(ray, roadBorder, traffic));
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.rayCount; i++) {
            let end: Point = this.rays[i][1];

            if (this.readings[i]) {
                end = this.readings[i]!;
            }

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = SENSOR_COLOR;
            ctx.moveTo(
                this.rays[i][0].x,
                this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // draw shadow, the path of the ray as if it was not intercepted.
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = SHADOW_COLOR;
            ctx.moveTo(
                this.rays[i][1].x,
                this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    private getReading(ray: Point[], roadBorders: Point[][], traffic: Car[]): Intersection | null {
        let touches = [];
        for (const border of roadBorders) {
            const touch = getIntersection(ray[0], ray[1], border[0], border[1]);
            if (touch) {
                touches.push(touch);
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const value = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j + 1) % poly.length]
                );
                if (value) {
                    touches.push(value);
                }
            }

        }

        if (touches.length == 0) {
            return null;
        } else {
            const offsets = touches.map(e => e.offset);
            const minOffset = Math.min(...offsets);
            return touches.find(e => e.offset == minOffset) ?? null;
        }
    }

    private castSensorRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.raySpread / 2,
                -this.raySpread / 2,
                i / (this.rayCount - 1)) + this.car.angle;

            const start = { x: this.car.x, y: this.car.y };

            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength
            };

            this.rays.push([start, end]);
        }
    }
}