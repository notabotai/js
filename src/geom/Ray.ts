import { Point } from "./Point.ts";

export class Ray {
  from: Point;
  angle: number;
  length?: number;

  constructor(from: Point, angle: number, length?: number) {
    this.from = from;
    this.angle = angle;
    this.length = length;
  }
}
