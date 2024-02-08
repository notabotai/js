import { Rect } from "./Rect.ts";
import { Equation } from "./Equation.ts";
import { Line } from "./Line.ts";

/* Point
 *
 * Utility class for 2D points
 */
export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  static fromLength(len: number) {
    return new Point(len, 0);
  }

  static fromAngle(angle: number) {
    return Point.fromPolar(angle, 1);
  }

  static fromPolar(angle: number, len = 1) {
    return new Point(len * Math.cos(angle), len * Math.sin(angle))
  }

  static zero() {
    return new Point(0, 0);
  }

  static half(positive = true) {
    const amount = positive ? 0.5 : -0.5;
    return new Point(amount, amount);
  }

  static up(amount = 1) {
    return new Point(0, amount);
  }

  static down(amount = 1) {
    return new Point(0, -amount);
  }

  static left(amount = 1) {
    return new Point(-amount, 0);
  }

  static right(amount = 1) {
    return new Point(amount, 0);
  }

  equals(point: Point) {
    return this.x === point.x && this.y === point.y;
  }

  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  set(point: Point) {
    this.x = point.x;
    this.y = point.y;
    return this;
  }

  clone() {
    return new Point(this.x, this.y);
  }

  distanceFrom(point: Point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  addXY(x: number, y: number) {
    this.x += x;
    this.y += y;
    return this;
  }

  add(point: Point) {
    this.x += point.x;
    this.y += point.y;
    return this;
  }

  subtractXY(x: number, y: number) {
    this.x -= x;
    this.y -= y;
    return this;
  }

  subtract(point: Point) {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }

  scale(s: number) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  scaleXY(x: number, y: number) {
    this.x *= x;
    this.y *= y;
    return this;
  }

  scaleBy(point: Point) {
    this.x *= point.x;
    this.y *= point.y;
    return this;
  }

  clampMinMax(min: Point, max: Point) {
    this.x = Math.min(Math.max(this.x, min.x), max.x);
    this.y = Math.min(Math.max(this.y, min.y), max.y);
    return this;
  }

  clamp(rect: Rect) {
    return this.clampMinMax(rect.bottomLeft, rect.topRight);
  }

  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.len();
    this.x /= len;
    this.y /= len;
    return this;
  }

  modulo(point: Point) {
    this.x %= point.x;
    this.y %= point.y;
    return this;
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number) {
    const len = this.len();
    const currentAngle = this.angle;
    this.x = len * Math.cos(currentAngle + angle);
    this.y = len * Math.sin(currentAngle + angle);
    return this;
  }

  equationWithSlope(slope: number) {
    // Explanation:
    // y - y1 = m(x - x1)
    // y - y1 = m.x - m.x1
    // -m.x + y + m.x1 - y1 = 0
    // (m).x + (-1).y + (y1 - m.x1) = 0
    // => a = m, b = -1, c = y1 - m.x1
    if (slope === Infinity) {
      return new Equation(1, 0, -this.x);
    }
    return new Equation(slope, -1, this.y - slope * this.x);
  }

  perpendicularLineTo(line: Line) {
    const endpointOnLine = this.perpendicularIntersectionOn(line);
    if (endpointOnLine === null) {
      return null;
    }
    return new Line(this.clone(), endpointOnLine);
  }

  perpendicularIntersectionOn(line: Line) {
    const slope = line.perpendicularSlope();
    const eqn = this.equationWithSlope(slope);
    return line.equation().intersectionWith(eqn);
  }
}
