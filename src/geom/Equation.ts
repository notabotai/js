import { Point } from "./Point.ts";

/* Equation
 *
 * Utility class for 2D line equations
 * ax + by + c = 0
 */
export class Equation {
  a: number;
  b: number;
  c: number;

  constructor(a: number, b: number, c: number) {
    this.a = a;
    this.b = b;
    this.c = c;
  }

  intersectionWith(eqn: Equation) {
    // a1*x + b1*y + c1 = 0
    // a2*x + b2*y + c2 = 0
    // determinant = a2 * b1 - a1 * b2;
    // (b2.eqn1 - b1.eqn2): x = (c1 * b2 - c2 * b1) / determinant
    // (a1.eqn2 - a2.eqn1): y = (a1 * c2 - a2 * c1) / determinant;
    const determinant = eqn.a * this.b - this.a * eqn.b;
    if (determinant === 0) {
      return null;
    }
    const x = (this.c * eqn.b - eqn.c * this.b) / determinant;
    const y = (this.a * eqn.c - eqn.a * this.c) / determinant;
    return new Point(x, y);
  }
}
