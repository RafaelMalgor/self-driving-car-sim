import { Car, SmartCar, TrafficCar } from './car';
import { NNControl } from './controls';
import { NNetwork } from './network';
import { Road } from './road';
import './style.css'

const simCanvas = document.getElementById("simCanvas") as HTMLCanvasElement;
simCanvas.width = 350;

const simCtx = simCanvas.getContext("2d")!;
const lineCount = 3;
const road = new Road(simCanvas.width * .5, simCanvas.width * .5, lineCount);

let redCarImage = new Image();
redCarImage.src = "red_car.png";
let cars = generateAICars(500);
let traffic: Car[] = [];

let previousTrafficTimestamp = Date.now();
let longestSurvivor = cars[0];
let mostDistant = cars[0];
animate();
function animate() {
  traffic = updateTraffic(traffic);

  cars = updateCars(cars);

  const newLongestSurvivor = findLongestSurvivor(cars);
  if (newLongestSurvivor) {
    longestSurvivor = newLongestSurvivor!;
    mostDistant = longestSurvivor.y < mostDistant.y ? longestSurvivor : mostDistant;
    longestSurvivor!.drawSensor = true;

    previousTrafficTimestamp = generateTraffic(longestSurvivor!, previousTrafficTimestamp, lineCount);

    simCanvas.height = window.innerHeight;

    drawElements(road, traffic, cars, longestSurvivor!);
  }
  else {
    cars = generateAICars(500, mostDistant);
    previousTrafficTimestamp = Date.now();
    longestSurvivor = cars[0];
    mostDistant = cars[0];
    traffic = [];
  }
  requestAnimationFrame(animate);
}

function generateAICars(n: number, parent: SmartCar | null = null) {
  const cars: SmartCar[] = [];

  if (parent) {
    cars.push(parent);
    n--;
  }

  for (let i = 0; i <= n; i++) {
    const car = new SmartCar(road.getLineCenter(1), 100, 30, 50, 6, 10, redCarImage);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(parent.getAI())) as NNetwork;
      NNetwork.mutate(clone, 0.5)
      car.controls = new NNControl(clone);
    }
    cars.push(car);
  }
  return cars;
}

function generateTraffic(longestSurvivor: SmartCar, previousTrafficTimestamp: number, lineCount: number) {
  const currentTimestamp = Date.now();
  if (currentTimestamp - previousTrafficTimestamp > 1000) {
    let greenCarImage = new Image();
    greenCarImage.src = "green_car.png";
    traffic.push(new TrafficCar(road.getLineCenter(Math.floor((Math.random() * lineCount))), longestSurvivor!.y - 4000, 30, 50, Math.floor((Math.random() * 2)), greenCarImage));
    previousTrafficTimestamp = Date.now();
  }
  return previousTrafficTimestamp;
}

function drawElements(road: Road, traffic: Car[], cars: SmartCar[], longestSurvivor: SmartCar) {
  simCtx.save();
  simCtx.translate(0, -longestSurvivor.y + simCanvas.height * 0.8);

  road.draw(simCtx);

  for (const car of traffic) {
    car.draw(simCtx);
  }

  simCtx.globalAlpha = 0.3;
  for (const car of cars) {
    car.draw(simCtx);
  }
  simCtx.globalAlpha = 1;

  longestSurvivor.draw(simCtx);

  simCtx.restore();
}

function updateTraffic(traffic: Car[]): Car[] {
  const filteredTraffic = traffic.filter(t => t.y < Math.max(...cars.map(c => c.y)));

  for (const car of filteredTraffic) {
    car.update(road.borders, []);
  }
  return filteredTraffic;
}

function updateCars(cars: SmartCar[]): SmartCar[] {
  const filteredCars = cars
    .filter(c => !c.damaged)
    .filter(c => !(c.stoppedAt != null && (Date.now() - c.stoppedAt) > 2000));
  // .filter(c => c.speed > 0);
  for (const car of filteredCars) {
    car.update(road.borders, traffic);
  }
  return filteredCars;
}

function findLongestSurvivor(cars: SmartCar[]) {
  return cars.find(
    c => c.y == Math.min(...cars.map(c => c!.y))
  );
}

