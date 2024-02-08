import { Point } from "./Point.ts";
import { Ray } from "./Ray.ts";
import { Equation } from "./Equation.ts";

/* Line
 *
 * Utility class for 2D lines
 */
export class Line {
  from: Point;
  to: Point;

  constructor(from: Point, to: Point) {
    this.from = from;
    this.to = to;
  }

  static fromRay(ray: Ray, length: number) {
    const endPos = Point.fromAngle(ray.angle).scale(length).add(ray.from);
    return new Line(ray.from, endPos);
  }

  midpoint() {
    return new Point(
      (this.from.x + this.to.x) / 2,
      (this.from.y + this.to.y) / 2
    );
  }

  len() {
    return this.from.distanceFrom(this.to);
  }

  angle() {
    return Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);
  }

  clone() {
    return new Line(this.from.clone(), this.to.clone());
  }

  setFromTo(from: Point, to: Point) {
    this.from = from;
    this.to = to;
  }

  addXY(x: number, y: number) {
    this.from.addXY(x, y);
    this.to.addXY(x, y);
    return this;
  }

  subtractXY(x: number, y: number) {
    this.from.subtractXY(x, y);
    this.to.subtractXY(x, y);
    return this;
  }

  add(point: Point) {
    this.addXY(point.x, point.y);
    return this;
  }

  scale(s: number) {
    this.from.scale(s);
    this.to.scale(s);
    return this;
  }

  vector() {
    return new Point(this.to.x - this.from.x, this.to.y - this.from.y);
  }

  slope() {
    if (this.to.x === this.from.x) {
      return Infinity;
    }
    return (this.to.y - this.from.y) / (this.to.x - this.from.x);
  }

  perpendicularSlope() {
    const slope = this.slope();
    if (slope === 0) {
      return Infinity;
    }
    if (slope === Infinity) {
      return 0;
    }
    return -1 / slope;
  }

  yIntercept() {
    return this.from.y - this.slope() * this.from.x;
  }

  equation() {
    // a.x1 + b.y1 + c = 0
    // a.x2 + b.y2 + c = 0
    // determinant = x2.y1 - x1.y2
    // y2.eqn1 - y1.eqn2: a/c = (y2 - y1) / determinant
    // x1.eqn2 - x2.eqn1: b/c = (x1 - x2) / determinant
    //  a = (y2 - y1) / determinant
    //  b = (x1 - x2) / determinant
    //  c = 1
    const determinant = this.to.x * this.from.y - this.from.x * this.to.y;
    if (determinant === 0) {
      // line is passing through the origin
      return new Equation(this.to.y - this.from.y, this.from.x - this.to.x, 0);
    }
    return new Equation(
      (this.to.y - this.from.y) / determinant,
      (this.from.x - this.to.x) / determinant,
      1
    );
  }

  intersectionWith(line: Line) {
    const eqn1 = this.equation();
    const eqn2 = line.equation();
    return eqn1.intersectionWith(eqn2);
  }

  // https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
  signWith(c: Point) {
    const { from: a, to: b } = this;
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
  }
}
