import { Point } from "./Point.ts";

/* Rect
 *
 * Utility class for 2D rectangles
 * bottomLeft and topRight are the coordinates of the bottom-left and top-right corners
 * parent is the parent rectangle, if any
 */
type MaybeRect = Rect | null;

export class Rect {
  bottomLeft: Point;
  topRight: Point;
  parent: Rect | null = null;

  constructor(bottomLeft: Point, topRight: Point, parent: MaybeRect = null) {
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
    this.parent = parent;
  }

  static from(bottomLeft: Point, topRight: Point, parent: MaybeRect = null) {
    return new Rect(bottomLeft, topRight, parent);
  }

  static zero() {
    return new Rect(Point.zero(), Point.zero());
  }

  static unit() {
    return new Rect(Point.zero(), new Point(1, 1));
  }

  static fromXY(x: number, y: number) {
    return new Rect(new Point(x, y), new Point(x, y));
  }

  static fromX2Y2(x1: number, y1: number, x2: number, y2: number) {
    return new Rect(new Point(x1, y1), new Point(x2, y2));
  }

  static fromScalar(s: number) {
    return new Rect(new Point(s, s), new Point(s, s));
  }

  static fromPoint(point: Point) {
    return new Rect(Point.zero(), point.clone());
  }

  hStack(widths: number[], margin: MaybeRect = null, spacing = 0) {
    const rects: Rect[] = [];
    const { left, right, top, bottom } = this.withMargin(margin);
    let x =
      left + (right - left - (widths.length - 1) * spacing - sum(widths)) / 2;
    for (const width of widths) {
      rects.push(
        new Rect(new Point(x, bottom), new Point(x + width, top), this)
      );
      x += width + spacing;
    }
    return rects;
  }

  hStackEqual(count: number, margin: MaybeRect = null) {
    const rects: Rect[] = [];
    const { left, right, top, bottom } = this.withMargin(margin);
    const width = (right - left) / count;
    let x = left;
    for (let i = 0; i < count; i++) {
      rects.push(
        new Rect(new Point(x, bottom), new Point(x + width, top), this)
      );
      x += width;
    }
    return rects;
  }

  vStack(heights: number[], margin: MaybeRect = null, spacing = 0) {
    const rects: Rect[] = [];
    const { left, right, top, bottom } = this.withMargin(margin);
    let y = top - (top - bottom - sum(heights)) / 2;
    for (const height of heights) {
      rects.push(
        new Rect(new Point(left, y - height), new Point(right, y), this)
      );
      y -= height + spacing;
    }
    return rects;
  }

  vStackEqual(count: number, margin: MaybeRect = null) {
    const rects: Rect[] = [];
    const { left, right, top, bottom } = this.withMargin(margin);
    const height = (top - bottom) / count;
    let y = bottom;
    for (let i = 0; i < count; i++) {
      rects.push(
        new Rect(new Point(left, y), new Point(right, y + height), this)
      );
      y += height;
    }
    return rects;
  }

  withMargin(margin: MaybeRect) {
    if (!margin) {
      return this;
    }
    return new Rect(
      this.bottomLeft.clone().add(margin.bottomLeft),
      this.topRight.clone().subtract(margin.topRight)
    );
  }

  withMarginXY(x: number, y: number) {
    return new Rect(
      this.bottomLeft.clone().addXY(x, y),
      this.topRight.clone().subtractXY(x, y)
    );
  }

  withMarginAll(margin: number) {
    return this.withMarginXY(margin, margin);
  }

  get width() {
    return this.topRight.x - this.bottomLeft.x;
  }

  get height() {
    return this.topRight.y - this.bottomLeft.y;
  }

  get center() {
    return new Point(
      (this.bottomLeft.x + this.topRight.x) / 2,
      (this.bottomLeft.y + this.topRight.y) / 2
    );
  }

  get bottom() {
    return this.bottomLeft.y;
  }

  get top() {
    return this.topRight.y;
  }

  get left() {
    return this.bottomLeft.x;
  }

  get right() {
    return this.topRight.x;
  }

  get aspectRatio() {
    return this.width / this.height;
  }

  get size() {
    return new Point(this.width, this.height);
  }

  clone() {
    return new Rect(this.bottomLeft.clone(), this.topRight.clone());
  }

  scale(s: number) {
    this.bottomLeft.scale(s);
    this.topRight.scale(s);
    return this;
  }

  scaleX(s: number) {
    this.bottomLeft.x *= s;
    this.topRight.x *= s;
    return this;
  }

  intersect(rect: Rect) {
    this.bottomLeft.setXY(
      Math.max(this.bottomLeft.x, rect.bottomLeft.x),
      Math.max(this.bottomLeft.y, rect.bottomLeft.y)
    );
    this.topRight.setXY(
      Math.min(this.topRight.x, rect.topRight.x),
      Math.min(this.topRight.y, rect.topRight.y)
    );
    return this;
  }

  contains(point: Point) {
    return (
      point.x >= this.bottomLeft.x &&
      point.x <= this.topRight.x &&
      point.y >= this.bottomLeft.y &&
      point.y <= this.topRight.y
    );
  }

  translate(point: Point) {
    this.bottomLeft.add(point);
    this.topRight.add(point);
    return this;
  }

  translateY(y: number) {
    this.bottomLeft.y += y;
    this.topRight.y += y;
    return this;
  }

  moveCenterTo(point: Point) {
    this.translate(point.clone().subtract(this.center));
    return this;
  }

  moveCenterYTo(point: Point) {
    this.translateY(point.y - this.center.y);
    return this;
  }
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
