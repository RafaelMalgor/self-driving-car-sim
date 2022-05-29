import { AlwaysForwardControls, Control, NNControl, StaticControl } from "./controls";
import { NNetwork } from "./network";
import { Sensor } from "./sensor";
import { Point, polygonsIntersect } from "./utils";

export class Car {
    controls: Control;
    acceleration: number;
    speed: number;
    friction: number;
    angle: number;
    polygon: { x: number; y: number; }[];
    damaged: boolean;
    turningSpeed: number;
    constructor(public x: number,
        public y: number,
        public width: number,
        public height: number,
        private maxSpeed = 3,
        private carImage: HTMLImageElement | undefined = undefined) {

        this.controls = new StaticControl();

        this.speed = 0;
        this.acceleration = 0.1;
        this.friction = 0.02;
        this.angle = 0;
        this.polygon = this.createPolygon();
        this.damaged = false;
        this.turningSpeed = 0.01;
    }

    update(roadBorders: Point[][], traffic: Car[]) {
        if (!this.damaged) {
            this.move();
            this.polygon = this.createPolygon();
            this.damaged = this.assessDamage(roadBorders, traffic);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.carImage) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(-this.angle);
            ctx.drawImage(this.carImage, - this.width / 2, - this.height / 2, 30, 50);
            ctx.restore()
        } else {
            ctx.beginPath();
            ctx.fillStyle = "black";
            ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
            for (let i = 1; i < this.polygon.length; i++) {
                ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
            }
            ctx.fill();
        }

        if (this.damaged) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "blue";
            ctx.fill();
        }
    }

    private move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 4) {
            this.speed = -this.maxSpeed / 4;
        }
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        // if speed is less than friction, floor it
        // This prevents it from overflowing to the other side
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }
        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;

            if (this.controls.left) {
                this.angle += this.turningSpeed * flip;
            }
            if (this.controls.right) {
                this.angle -= this.turningSpeed * flip;
            }
        }


        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    protected createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);

        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });

        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });

        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });

        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    private assessDamage(roadBorder: Point[][], traffic: Car[]): boolean {
        for (const border of roadBorder) {
            if (polygonsIntersect(this.polygon, border)) {
                return true;
            }
        }
        for (const trafficCar of traffic) {
            if (polygonsIntersect(this.polygon, trafficCar.polygon)) {
                return true;
            }
        }
        return false;
    }
}

export class TrafficCar extends Car {

    constructor(public x: number,
        public y: number,
        public width: number,
        public height: number,
        maxSpeed = 2,
        carImage: HTMLImageElement | undefined = undefined) {
        super(x, y, width, height, maxSpeed, carImage);

        this.controls = new AlwaysForwardControls();
        this.speed = 0;
        this.acceleration = 0.1;
        this.friction = 0.02;
        this.angle = 0;
        this.polygon = this.createPolygon();
        this.damaged = false;
        this.turningSpeed = 0.01;
    }
}

export class SmartCar extends Car {
    sensor: Sensor;
    stoppedAt: number | null;
    startPoint: number;
    distance: number;

    constructor(public x: number,
        public y: number,
        public width: number,
        public height: number,
        maxSpeed = 3,
        rayCount = 5,
        carImage: HTMLImageElement | undefined = undefined,
        public drawSensor = false) {
        super(x, y, width, height, maxSpeed, carImage);

        this.startPoint = this.x;
        this.distance = 0;
        this.stoppedAt = Date.now();
        this.controls = new NNControl(new NNetwork([rayCount, 6, 4]));
        this.sensor = new Sensor(this, rayCount);
        this.speed = 0;
        this.acceleration = 0.1;
        this.friction = 0.02;
        this.angle = 0;
        this.polygon = this.createPolygon();
        this.damaged = false;
        this.turningSpeed = 0.01;
    }

    public getAI() {
        return (this.controls as NNControl).ai;
    }

    update(roadBorders: Point[][], traffic: Car[]) {
        super.update(roadBorders, traffic);

        if (this.speed > 0.5) {
            this.stoppedAt = null;
        } else if (this.stoppedAt == null) {
            this.stoppedAt = Date.now();
        }

        this.sensor.update(roadBorders, traffic);
        const offsets = this.sensor.readings.map(s =>
            s == null ? 0 : 1 - s.offset);
        const nnControls = this.controls as NNControl;
        nnControls.update(offsets);

    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.drawSensor)
            this.sensor.draw(ctx);
        super.draw(ctx);
    }
}