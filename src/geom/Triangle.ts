import { Point } from "./Point.ts";

/* Triangle
 *
 * Utility class for 2D triangles
 * a, b, and c are the coordinates of the three corners
 */
export class Triangle {
  a: Point;
  b: Point;
  c: Point;
  constructor(a: Point, b: Point, c: Point) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
  static unit() {
    return Triangle.equilateral(1).rotate(-Math.PI / 2);
  }
  static from(a: Point, b: Point, c: Point) {
    return new Triangle(a, b, c);
  }
  static equilateral(side: number) {
    const height = Math.sqrt(side * side - (side / 2) * (side / 2));
    return new Triangle(
      new Point(0, 0),
      new Point(side, 0),
      new Point(side / 2, height)
    ).translateXY(-side / 2, -height / 3);
  }
  static right(side: number) {
    return new Triangle(
      new Point(0, 0),
      new Point(side, 0),
      new Point(0, side)
    );
  }
  static zero() {
    return new Triangle(Point.zero(), Point.zero(), Point.zero());
  }
  translateXY(x: number, y: number) {
    this.a.addXY(x, y);
    this.b.addXY(x, y);
    this.c.addXY(x, y);
    return this;
  }
  translate(point: Point) {
    return this.translateXY(point.x, point.y);
  }
  scale(s: number) {
    this.a.scale(s);
    this.b.scale(s);
    this.c.scale(s);
    return this;
  }
  clone() {
    return new Triangle(this.a.clone(), this.b.clone(), this.c.clone());
  }
  get centroid() {
    return new Point(
      (this.a.x + this.b.x + this.c.x) / 3,
      (this.a.y + this.b.y + this.c.y) / 3
    );
  }
  rotate(angle: number, center = Point.zero()) {
    this.a.subtract(center).rotate(angle).add(center);
    this.b.subtract(center).rotate(angle).add(center);
    this.c.subtract(center).rotate(angle).add(center);
    return this;
  }
}
