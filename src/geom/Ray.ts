import { Point } from "./Point.ts";

export class Ray {
  from: Point;
  angle: number;

  constructor(from: Point, angle: number) {
    this.from = from;
    this.angle = angle;
  }
}
