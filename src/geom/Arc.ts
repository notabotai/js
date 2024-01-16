import { Point } from "./Point.ts";
import { Circle } from "./Circle.ts";

export class Arc extends Circle {
  startAngle: number;
  endAngle: number;

  constructor(
    center: Point,
    radius: number,
    startAngle = 0,
    endAngle = 2 * Math.PI
  ) {
    super(center, radius);
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }
}
