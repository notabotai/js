import { Point } from "./Point.ts";

export class Circle {
  center: Point;
  radius: number;

  constructor(center: Point, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  clone() {
    return new Circle(this.center.clone(), this.radius);
  }

  scale(factor: number) {
    this.radius *= factor;
    return this;
  }
}
