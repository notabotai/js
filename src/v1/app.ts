import type dat from "../types/dat.gui";

Math.sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

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
  static from(x: number, y: number) {
    return new Point(x, y);
  }
  static fromLength(len: number) {
    return new Point(len, 0);
  }
  static fromAngle(angle: number) {
    return new Point(Math.cos(angle), Math.sin(angle));
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
  static between(from: Point, to: Point) {
    return new Line(from.clone(), to.clone());
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
}

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
  static fromXY(x: number, y: number) {
    return new Rect(Point.from(x, y), Point.from(x, y));
  }
  static fromX2Y2(x1: number, y1: number, x2: number, y2: number) {
    return new Rect(Point.from(x1, y1), Point.from(x2, y2));
  }
  static fromScalar(s: number) {
    return new Rect(Point.from(s, s), Point.from(s, s));
  }
  static fromPoint(point: Point) {
    return new Rect(Point.zero(), point.clone());
  }
  hStack(widths: number[], margin: MaybeRect = null, spacing = 0) {
    const rects: Rect[] = [];
    let { left, right, top, bottom } = this.withMargin(margin);
    let x =
      left +
      (right - left - (widths.length - 1) * spacing - Math.sum(widths)) / 2;
    for (const width of widths) {
      rects.push(
        new Rect(Point.from(x, bottom), Point.from(x + width, top), this)
      );
      x += width + spacing;
    }
    return rects;
  }
  hStackEqual(count: number, margin: MaybeRect = null) {
    const rects: Rect[] = [];
    let { left, right, top, bottom } = this.withMargin(margin);
    const width = (right - left) / count;
    let x = left;
    for (let i = 0; i < count; i++) {
      rects.push(
        new Rect(Point.from(x, bottom), Point.from(x + width, top), this)
      );
      x += width;
    }
    return rects;
  }
  vStack(heights: number[], margin: MaybeRect = null, spacing = 0) {
    const rects: Rect[] = [];
    let { left, right, top, bottom } = this.withMargin(margin);
    let y = bottom + (top - bottom - Math.sum(heights)) / 2;
    for (const height of heights) {
      rects.push(
        new Rect(Point.from(left, y), Point.from(right, y + height), this)
      );
      y += height + spacing;
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
        new Rect(Point.from(left, y), Point.from(right, y + height), this)
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
}

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
      Point.from(0, 0),
      Point.from(side, 0),
      Point.from(side / 2, height)
    ).translateXY(-side / 2, -height / 3);
  }
  static right(side: number) {
    return new Triangle(
      Point.from(0, 0),
      Point.from(side, 0),
      Point.from(0, side)
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

/* Cell
 *
 * A cell is a single unit in a table. It can be empty or contain a player or
 * an obstacle.
 *
 * It's a data class
 */
export class Cell {
  table: Table;
  pos: Point;
  constructor(table: Table, pos: Point) {
    this.table = table;
    this.pos = pos;
  }
}

/* Table
 *
 * Utility class for 2D tables (grid of cells)
 * rowCount and colCount are the number of rows and columns
 * cells is a 1D array of all the cells
 */
export class Table {
  rowCount: number;
  colCount: number;
  bounds: Rect;
  constructor(rowCount: number, colCount: number, bounds: Rect) {
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.bounds = bounds;
  }
  indexToPos(index: number) {
    return Point.from(Math.floor(index / this.rowCount), index % this.colCount);
  }
  posToIndex(pos: Point) {
    return pos.x * this.rowCount + pos.y;
  }
  clone() {
    return new Table(this.rowCount, this.colCount, this.bounds.clone());
  }
}

/* app
 *
 * Main application object
 * Initialize the different features at the start of the application
 * Call the update function for each feature on each frame
 * Reset the state of the application at the end of each frame
 *
 * Call app.init() to start the application (see the end of this file)
 */
export class App {
  paused = false;
  frame = 0;
  browserTime = 0;
  time = 0;
  dt = 0;
  features: Feature[] = [];

  debug = new Debug();
  settings = new Settings(this.debug);

  palette = new PaletteFeature(this, "palette");
  input = new InputFeature(this, "input");
  reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
  animate = new AnimateFeature(this, "animate");
  canvas = new CanvasFeature(this, "canvas");
  drawDebug = new DrawDebugFeature(this, "drawDebug");
  grid = new GridFeature(this, "grid");

  constructor() {
    // requires app.settings.gui to have been initialized
    const appSettings = this.settings.gui.addFolder("app");
    appSettings.add(this, "paused").listen();
    appSettings.add(this, "frame").listen();
    appSettings.add(this, "browserTime").listen();
    appSettings.add(this, "time").listen();
    appSettings.add(this, "dt").listen();

    const updateLoop = (browserTime: number) => {
      if (this.paused) {
        this.dt = 0;
        this.browserTime = browserTime;
        return requestAnimationFrame(updateLoop);
      }
      this.frame += 1;
      this.dt = browserTime - this.browserTime;
      this.time += this.dt;
      this.browserTime = browserTime;
      for (const feature of this.features) {
        feature.update();
      }
      for (const feature of this.features) {
        feature.reset();
      }
      this.debug.flush();
      return requestAnimationFrame(updateLoop);
    };

    updateLoop(0);
  }
}

export abstract class Feature {
  name: string;
  app: App;
  debug: DebugLogger;
  settings: dat.GUI;

  constructor(app: App, name: string) {
    this.app = app;
    this.name = name;
    this.app.features.push(this);
    this.settings = this.app.settings.gui.addFolder(this.name);
    this.debug = this.app.debug.getNamespace(this.name);
  }

  update(): void {}
  reset(): void {}
}

type DebugValue = any;

type DebugLogger = {
  log: (key: string, ...values: DebugValue[]) => void;
  logLive: (key: string, ...values: DebugValue[]) => void;
  logValue: (key: string, ...values: DebugValue[]) => void;
  breakpoint: () => void;
};

type Stringifier = (value: DebugValue) => string | undefined;

/* debug
 *
 * Debugging tools
 * Show debug information in an HTML element every frame
 * Press Alt+P to show the pose data in the console
 */
class Debug {
  el = document.querySelector<HTMLElement>("#debug-el");
  lines: string[] = [];
  loggedValues: { [key: string]: string } = {};
  enabled = false;
  hasBreakpoint = false;

  constructor() {
    this.enabled = this.getQueryParam("debug") === "true";
  }

  flush() {
    if (!this.enabled) return;
    this.displayCollectedLogLines();
    this.lines = [];
  }

  getNamespace(featureName: string): DebugLogger {
    return {
      log: (key: string, ...values: DebugValue[]) =>
        this.log(featureName, key, ...values),
      logLive: (key: string, ...values: DebugValue[]) =>
        this.logLive(featureName, key, ...values),
      logValue: (key: string, ...values: DebugValue[]) =>
        this.logValue(featureName, key, ...values),
      breakpoint: () => this.breakpoint(),
    };
  }

  // Show the collected lines of debug log in the HTML element
  displayCollectedLogLines() {
    const valuesStr = Object.keys(this.loggedValues)
      .map((k) => this.loggedValues[k])
      .join("\n");
    const linesStr = this.lines.join("\n");
    if (this.el) this.el.innerText = `${valuesStr}\n---\n${linesStr}`;
  }

  getQueryParam(name: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Add a line of text to the debug log
  logLive(featureName: string, key: string, ...values: DebugValue[]) {
    if (!this.enabled) return;
    this.lines.push(this.getDebugText(featureName, key, values));
  }

  // Add a line of text to the debug log and print it to the console
  log(featureName: string, key: string, ...values: DebugValue[]) {
    console.log(featureName, key, ...values);
  }

  logValue(featureName: string, key: string, ...values: DebugValue[]) {
    this.loggedValues[`${featureName}: ${key}`] = this.getDebugText(
      featureName,
      key,
      values
    );
  }

  selectiveStringify(
    value: DebugValue,
    stringifier: Stringifier
  ): string | undefined {
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    if (value instanceof Point) {
      return value.toString();
    }
    const customStringifierResult = stringifier(value);
    if (customStringifierResult !== undefined) {
      return customStringifierResult;
    }
    return;
  }

  getDebugText(
    featureName: string,
    key: string,
    values: DebugValue[],
    stringifier: Stringifier = () => undefined
  ) {
    if (values.length === 0) {
      return `${featureName}: ${key}`;
    }
    const valuesStr = values
      .map((value: DebugValue) => {
        const possibleResult = this.selectiveStringify(value, stringifier);
        if (possibleResult !== undefined) {
          return possibleResult;
        }
        return JSON.stringify(value, (_, v) => {
          const potentialResult = this.selectiveStringify(v, stringifier);
          if (potentialResult !== undefined) {
            return potentialResult;
          }
          return v;
        });
      })
      .join(", ");
    return `${featureName}: ${key} = ${valuesStr}`;
  }

  breakpoint() {
    this.hasBreakpoint = true;
    debugger;
  }
}

/* settings
 *
 * Settings for the app, editable in UI
 */
class Settings {
  gui: any = (function () {
    const mock = function () {
      return ret;
    };
    const ret = {
      add: mock,
      addFolder: mock,
      listen: mock,
      name: mock,
      step: mock,
      onChange: mock,
      removeFolder: mock,
    };
    return ret;
  })();

  constructor(debug: Debug) {
    if (!debug.enabled || !window.dat) return;
    this.gui = new window.dat.GUI();
    this.gui.useLocalStorage = true;
    this.gui.closed = true;
  }
}

type PaletteName = "pastel";
type Palette = {
  background: string;
  surface: string;
  divider: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryTransparent: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  secondaryTransparent: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  black: string;
  gray: string;
  grayDark: string;
  grayLight: string;
  white: string;
};
export type PaletteColor = keyof Palette;

/* palette
 *
 * App's color palette
 * - chosen: the palette currently in use
 * - options: the available palettes
 */
class PaletteFeature extends Feature {
  chosen: PaletteName = "pastel";
  options: Record<PaletteName, Palette> = {
    pastel: {
      background: "#F6F4EB",
      surface: "#AA96DA",
      divider: "#EEE0C9",
      primary: "#F3AA60",
      primaryDark: "#F97B22",
      primaryLight: "#FFB07F",
      primaryTransparent: "#F3AA6077",
      secondary: "#91C8E4",
      secondaryDark: "#4682A9",
      secondaryLight: "#A1CCD1",
      secondaryTransparent: "#91C8E477",
      textPrimary: "#F97B22",
      textSecondary: "#4682A9",
      textHint: "#445069",
      error: "#F38181",
      warning: "#FCE38A",
      info: "#5B9A8B",
      success: "#A8DF8E",
      black: "#272829",
      gray: "#61677A",
      grayDark: "#27374D",
      grayLight: "#D8D9DA",
      white: "#F1F6F9",
    },
  };
  colors: Palette = this.options[this.chosen];

  constructor(app: App, name: string) {
    super(app, name);
    this.settings
      .add(this, "chosen", Object.keys(this.options))
      .onChange((paletteName: PaletteName) => this.set(paletteName));
  }

  set(paletteName: PaletteName) {
    this.chosen = paletteName;
    this.colors = this.options[this.chosen];
  }
}

type InputPosition = {
  clientX: number;
  clientY: number;
};
type InputOriginalEvent = {
  preventDefault: () => void;
};

type InputKey = {
  altKey: boolean;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
} | null;

type InputPointer = Point | null;

/* input
 *
 * Mouse/pointer/touch and keyboard input
 * Use app.input.keyDown to get the key pressed in the last frame,
 * and app.input.{pointerDown, pointer, pointerUp} to get the pointer
 * interaction position in canvas coordinates
 *
 * this.pointer is the pointer position in canvas coordinates
 * this.pointerScreen is the pointer position in screen coordinates
 * they must be updated with changes to .x and .y, not reset to null or assigned a new Point
 * this is because pointerDown, pointerMove, and pointerUp are references to this.pointer
 */
class InputFeature extends Feature {
  private _keyDown: InputKey = null;
  private _pointerDown: InputPointer = null;
  private _pointerMove: InputPointer = null;
  private _pointerUp: InputPointer = null;
  private pointerScreen = Point.zero();

  pointer = Point.zero();
  dragStart: Point | null = null;
  dragDelta = Point.zero();

  get keyDown() {
    return this._keyDown;
  }
  get pointerDown() {
    return this._pointerDown;
  }
  get pointerMove() {
    return this._pointerMove;
  }
  get pointerUp() {
    return this._pointerUp;
  }

  // Save the keydown event as it happens,
  // for use by other features' update functions
  constructor(app: App, name: string) {
    super(app, name);
    self.addEventListener("keydown", (e) => {
      const { altKey, code, ctrlKey, metaKey, shiftKey } = e;
      this._keyDown = { altKey, code, ctrlKey, metaKey, shiftKey };
      if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
        e.preventDefault();
      }
    });
    self.addEventListener("mousedown", (e) => this.onPointerDown(e, e));
    self.addEventListener("touchstart", (e) =>
      this.onPointerDown(e.touches[0]!, e)
    );
    self.addEventListener("mousemove", (e) => this.onPointerMove(e, e));
    self.addEventListener("touchmove", (e) =>
      this.onPointerMove(e.touches[0]!, e)
    );
    self.addEventListener("mouseup", (e) => this.onPointerUp(e));
    self.addEventListener("touchend", (e) => this.onPointerUp(e));
  }

  override update() {
    const { canvas } = this.app;
    if (this._pointerDown || this._pointerMove || this._pointerUp) {
      // Convert the pointer position from screen coordinates to canvas coordinates
      canvas.setCanvasPointerFromScreenCoords(this.pointer, this.pointerScreen);
    }
  }

  // Reset the variables, except .pointer, at the end of each frame
  override reset() {
    this._keyDown = null;
    this._pointerDown = null;
    this._pointerMove = null;
    this._pointerUp = null;
  }

  onPointerDown(pos: InputPosition, originalEvent: InputOriginalEvent) {
    originalEvent.preventDefault();
    this.pointerScreen.setXY(pos.clientX, pos.clientY);
    this._pointerDown = this.pointer;
    if (!this.dragStart) {
      this.dragStart = this.pointer.clone();
    }
  }

  onPointerMove(pos: InputPosition, originalEvent: InputOriginalEvent) {
    originalEvent.preventDefault();
    this.pointerScreen.setXY(pos.clientX, pos.clientY);
    this._pointerMove = this.pointer;
    if (this.dragStart) {
      this.dragDelta.set(this.pointer).subtract(this.dragStart);
    }
  }

  onPointerUp(originalEvent: InputOriginalEvent) {
    originalEvent.preventDefault();
    this._pointerUp = this.pointer;
    this.dragStart = null;
    this.dragDelta.setXY(0, 0);
  }
}

/* reloadOnChange
 *
 * Reload the page when server detects a change in the source code, only in dev mode
 */
class ReloadOnChangeFeature extends Feature {
  eventSource = new EventSource("/last-change");

  constructor(app: App, name: string) {
    super(app, name);
    if (app.debug.enabled) {
      this.eventSource.onmessage = () => {
        this.eventSource.close();
        window.location.reload();
      };
    }
  }
}

type AnimBase = {
  obj: any;
  property: string;
  startValue: number;
  endValue: number;
  currentValue: number;
  progress: number;
};
type Anim = AnimBase &
  (
    | {
        type: "byTime";
        duration: number;
        startTime: number;
        randomDelay: number;
        delay: number;
        easing: EasingFn;
      }
    | {
        type: "bySpeed";
        speed: number;
      }
  );

type AnimOpts = {
  speed?: number;
  reachingThreshold?: number;
  duration?: number;
  easing?: EasingFn;
  randomDelay?: number;
  delay?: number;
};

type EasingFn = (t: number) => number;
class Easing {
  static linear(t: number) {
    return t;
  }
  static easeIn(t: number) {
    return t * t * t;
  }
  static easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }
  static easeInOut(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/* animate
 *
 * Allow discrete property changes to show up as animations
 */
export class AnimateFeature extends Feature {
  animations: Anim[] = [];
  animationDuration = 300;
  animationSpeed = 0.1;
  reachingThreshold = 0.01;

  constructor(app: App, name: string) {
    super(app, name);
  }

  override update() {
    const app = this.app;
    this.animations.forEach((anim: Anim) => {
      if (anim.progress >= 1) return;
      if (anim.type === "byTime") {
        const { startTime, duration, startValue, endValue, easing } = anim;
        if (app.time < startTime) return;
        const timeElapsed = app.time - startTime;
        const timeRemaining = duration - timeElapsed;
        if (timeRemaining <= 0) {
          anim.currentValue = endValue;
          anim.progress = 1;
        } else {
          anim.progress = Math.min(timeElapsed / duration, 1);
          const easingFn = easing || Easing.linear;
          const value =
            startValue + (endValue - startValue) * easingFn(anim.progress);
          anim.currentValue = value;
        }
      } else if (anim.type === "bySpeed") {
        const { currentValue, endValue, speed } = anim;
        if (Math.abs(currentValue - endValue) < this.reachingThreshold) {
          anim.currentValue = endValue;
        } else {
          anim.currentValue = currentValue + speed * (endValue - currentValue);
        }
      }
    });
  }

  byTime(obj: any, property: string, opts?: AnimOpts) {
    const app = this.app;
    opts = opts || {};
    opts.duration =
      opts.duration === undefined ? this.animationDuration : opts.duration;
    opts.easing = opts.easing || Easing.easeOut;
    opts.randomDelay = opts.randomDelay || 0;
    opts.delay = opts.delay || 0;
    const animation: Anim = {
      type: "byTime",
      obj,
      property,
      startValue: obj[property],
      endValue: obj[property],
      startTime: app.time,
      randomDelay: opts.randomDelay,
      delay: opts.delay,
      duration: opts.duration,
      currentValue: obj[property],
      progress: 1,
      easing: opts.easing,
    };
    this.animations.push(animation);
    Object.defineProperty(obj, property, {
      get: function () {
        return animation.currentValue;
      },
      set: function (value) {
        if (animation.endValue === value) return; // already at the target value
        if (animation.startValue === null) {
          // first time setting the value
          animation.currentValue = value;
          animation.startValue = value;
          animation.endValue = value;
          animation.progress = 1;
          return;
        }
        animation.startValue = animation.currentValue;
        animation.endValue = value;
        animation.delay =
          animation.randomDelay === 0
            ? animation.delay
            : Math.random() * animation.randomDelay;
        animation.startTime = app.time + animation.delay;
        animation.progress = 0;
      },
    });
  }

  bySpeed(obj: any, property: string, opts: AnimOpts) {
    opts = opts || {};
    opts.speed = opts.speed || this.animationSpeed;
    opts.reachingThreshold = opts.reachingThreshold || this.reachingThreshold;
    const animation: Anim = {
      type: "bySpeed",
      obj,
      property,
      startValue: obj[property],
      currentValue: obj[property],
      endValue: obj[property],
      speed: opts.speed,
      progress: 1,
    };
    this.animations.push(animation);
    Object.defineProperty(obj, property, {
      get: function () {
        return animation.currentValue;
      },
      set: function (value) {
        if (animation.endValue === value) return; // already going to the target value
        animation.endValue = value;
        animation.progress = 0;
      },
    });
  }

  getAnimationIndex(obj: any, property: string) {
    return this.animations.findIndex(
      (anim: Anim) => anim.obj === obj && anim.property === property
    );
  }

  removeAnimation(obj: any, property: string) {
    const animationIndex = this.getAnimationIndex(obj, property);
    const animation = this.animations[animationIndex];
    if (animationIndex === -1 || animation === undefined) {
      return;
    }
    const valueToSet = animation.endValue;
    delete obj[property];
    obj[property] = valueToSet;
    this.animations.splice(animationIndex, 1);
  }
}

interface CanvasCircleOpts {
  radius: number;
  color: PaletteColor;
  fixedRadius: boolean;
  arcStart: number;
  arcEnd: number;
}

interface CanvasPointsOpts {
  radius: number;
  color: PaletteColor;
}

interface CanvasTextOpts {
  size: number;
  font: string;
  color: PaletteColor;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  fixedSize: boolean;
}

interface CanvasLineOpts {
  lineWidth: number;
  color: PaletteColor;
  arrowSize: number;
  arrowStart: boolean;
  arrowEnd: boolean;
  arrowColor: PaletteColor;
}

interface CanvasRectOpts extends CanvasLineOpts {
  fill: boolean;
  fillColor: PaletteColor;
  cornerRadius: number;
}

interface CanvasRingOpts {
  color: PaletteColor;
  lineWidth: number;
  arcStart: number;
  arcEnd: number;
}

interface CanvasTriangleOpts {
  color: PaletteColor;
  lineWidth: number;
}

interface CanvasGridOpts {
  lineWidth: number;
}

/* canvas
 *
 * Manage the canvas element where the game is rendered
 */
class CanvasFeature extends Feature {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  scale = 1;
  toResizeNextFrame = true; // features dependent on canvas should resize on first frame
  unitScale = 100;
  defaultScale = 5;
  scaleCancelRatio = 1;

  constructor(app: App, name: string) {
    super(app, name);
    this.el =
      document.querySelector<HTMLCanvasElement>("#canvas-el") ||
      document.createElement("canvas");
    if (this.el.parentElement === null) {
      this.el.id = "canvas-el";
      document.body.appendChild(this.el);
    }
    this.ctx = this.el.getContext("2d")!;

    this.settings.add(this, "width").listen();
    this.settings.add(this, "height").listen();
    this.settings.add(this, "scale").listen();
    this.settings.add(this, "unitScale", 1, 100);
    this.settings.add(this, "defaultScale", 1, 100);
    this.settings.add(this, "scaleCancelRatio").listen();

    this.setSize();
    this.setCenteredCoordinates();
    this.ctx.imageSmoothingEnabled = false;

    self.addEventListener("resize", () => this.setSize());
  }

  override update() {
    if (this.toResizeNextFrame) {
      this.el.width = this.width;
      this.el.height = this.height;
      this.toResizeNextFrame = false;
    }
    if (this.app.debug.hasBreakpoint) {
      debugger;
    }
    this.clear();
    this.scaleCancelRatio =
      (window.devicePixelRatio * this.defaultScale) / this.scale;
  }

  clear() {
    const { palette } = this.app;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = palette.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.setInvertedYDirection();
  }

  setCenteredCoordinates() {
    this.setInvertedYDirection();
    const fillText = this.ctx.fillText;
    this.ctx.fillText = (text: string, x: number, y: number) => {
      this.resetYDirection();
      fillText.call(this.ctx, text, x, -y);
      this.setInvertedYDirection();
    };
  }

  setSize() {
    // important to set the width and height of the canvas element itself
    // (this.el.width and this.el.height)
    // otherwise the canvas will remain 300x150 pixels and rescaled by CSS
    // (blurry)
    // For retina displays, the canvas is scaled up by the devicePixelRatio for
    // perfect sharpness
    this.width = this.el.clientWidth * window.devicePixelRatio;
    this.height = this.el.clientHeight * window.devicePixelRatio;
    this.toResizeNextFrame = true;
  }

  // TODO: describe what scale means here
  setScale(scale: number) {
    this.scale = scale / this.unitScale;
    this.setInvertedYDirection();
  }

  setInvertedYDirection() {
    this.ctx.setTransform(
      this.scale,
      0,
      0,
      -this.scale,
      this.width / 2,
      this.height / 2
    );
  }

  resetYDirection() {
    this.ctx.setTransform(
      this.scale,
      0,
      0,
      this.scale,
      this.width / 2,
      this.height / 2
    );
  }

  setCanvasPointerFromScreenCoords(point: Point, screenPoint: Point) {
    const rect = this.el.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const scale = this.scale * this.unitScale;
    point.setXY(
      (dpr * (screenPoint.x - rect.left - this.width / dpr / 2)) / scale,
      (dpr * -(screenPoint.y - rect.top - this.height / dpr / 2)) / scale
    );
  }

  // consider the device to be in portrait mode if the aspect ratio is less than 1.2
  isPortrait() {
    return this.width / this.height < 1.2;
  }

  // this.scaleCancelRatio is used to cancel the scale factor of buttons and
  // interactive elements drawn bigger beyond so they're visible when grid is
  // large on a small screen
  distance(a: Point, b: Point) {
    return a.distanceFrom(b) / this.scaleCancelRatio;
  }

  // Draw methods
  drawCircle(
    pos: Point,
    {
      radius = 1,
      color = "black",
      fixedRadius = true,
      arcStart = 0,
      arcEnd = 2 * Math.PI,
    }: Partial<CanvasCircleOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    const r = fixedRadius ? radius : radius * this.scaleCancelRatio;
    this.ctx.arc(
      pos.x * this.unitScale,
      pos.y * this.unitScale,
      r * this.unitScale,
      arcStart,
      arcEnd
    );
    this.ctx.fillStyle = palette.colors[color];
    this.ctx.fill();
  }

  drawPoints(
    points: Point[],
    { radius = 1, color = "black" }: Partial<CanvasPointsOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    points.forEach((point: Point) => {
      const x = point.x * this.unitScale;
      const y = point.y * this.unitScale;
      this.ctx.moveTo(x, y);
      this.ctx.arc(
        x,
        y,
        radius * this.unitScale * this.scaleCancelRatio,
        0,
        2 * Math.PI
      );
    });
    this.ctx.fillStyle = palette.colors[color];
    this.ctx.fill();
  }

  drawText(
    pos: Point,
    text: string,
    {
      size = 0.5,
      font = "sans-serif",
      color = "black",
      align = "center",
      baseline = "middle", // alphabetic, top, hanging, middle, ideographic, bottom
      fixedSize = true,
    }: Partial<CanvasTextOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    const fontSize =
      size * this.unitScale * (fixedSize ? this.scaleCancelRatio : 1);
    this.ctx.font = `${fontSize}px ${font}`;
    this.ctx.fillStyle = palette.colors[color];
    this.ctx.fillText(text, pos.x * this.unitScale, pos.y * this.unitScale);
  }

  drawLine(
    line: Line,
    {
      lineWidth = 1,
      color = "black",
      arrowSize = 0.15,
      arrowStart = false,
      arrowEnd = false,
      arrowColor = color,
    }: Partial<CanvasLineOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    const arrowWidth = arrowSize * this.unitScale * this.scaleCancelRatio;
    const l = line.clone().scale(this.unitScale);
    const angle = l.angle();
    this.ctx.lineWidth = lineWidth * this.unitScale * this.scaleCancelRatio;
    this.ctx.moveTo(l.from.x, l.from.y);
    this.ctx.lineTo(l.to.x, l.to.y);
    this.ctx.strokeStyle = palette.colors[color];
    if (arrowColor !== color) {
      this.ctx.stroke();
      this.ctx.beginPath();
    }
    if (arrowStart) {
      this.ctx.moveTo(l.from.x, l.from.y);
      this.ctx.lineTo(
        l.from.x + arrowWidth * Math.cos(angle + Math.PI / 4),
        l.from.y + arrowWidth * Math.sin(angle + Math.PI / 4)
      );
      this.ctx.moveTo(l.from.x, l.from.y);
      this.ctx.lineTo(
        l.from.x + arrowWidth * Math.cos(angle - Math.PI / 4),
        l.from.y + arrowWidth * Math.sin(angle - Math.PI / 4)
      );
    }
    if (arrowEnd) {
      this.ctx.moveTo(l.to.x, l.to.y);
      this.ctx.lineTo(
        l.to.x + arrowWidth * Math.cos(angle + (Math.PI * 3) / 4),
        l.to.y + arrowWidth * Math.sin(angle + (Math.PI * 3) / 4)
      );
      this.ctx.moveTo(l.to.x, l.to.y);
      this.ctx.lineTo(
        l.to.x + arrowWidth * Math.cos(angle - (Math.PI * 3) / 4),
        l.to.y + arrowWidth * Math.sin(angle - (Math.PI * 3) / 4)
      );
    }
    this.ctx.strokeStyle = palette.colors[arrowColor];
    this.ctx.stroke();
  }

  drawRect(
    rect: Rect,
    {
      color = "black",
      lineWidth = 0.005,
      fill = false,
      fillColor = color,
      cornerRadius = 0,
    }: Partial<CanvasRectOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth * this.unitScale * this.scaleCancelRatio;
    const { left, top, right, bottom, width, height } = rect
      .clone()
      .scale(this.unitScale);
    if (cornerRadius > 0) {
      let radius = cornerRadius * this.unitScale;
      radius = Math.min(radius, width / 2, height / 2);
      this.ctx.moveTo(left + radius, top);
      this.ctx.arcTo(right, top, right, bottom, radius);
      this.ctx.arcTo(right, bottom, left, bottom, radius);
      this.ctx.arcTo(left, bottom, left, top, radius);
      this.ctx.arcTo(left, top, right, top, radius);
    } else {
      this.ctx.moveTo(left, top);
      this.ctx.lineTo(right, top);
      this.ctx.lineTo(right, bottom);
      this.ctx.lineTo(left, bottom);
      this.ctx.lineTo(left, top + this.ctx.lineWidth / 2); // to close the top left corner properly
    }
    this.ctx.strokeStyle = palette.colors[color];
    this.ctx.stroke();
    if (fill) {
      this.ctx.fillStyle = palette.colors[fillColor];
      this.ctx.fill();
    }
  }

  drawRing(
    pos: Point,
    radius: number,
    {
      color = "black",
      lineWidth = 0.1,
      arcStart = 0,
      arcEnd = 2 * Math.PI,
    }: Partial<CanvasRingOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth * this.unitScale * this.scaleCancelRatio;
    this.ctx.arc(
      pos.x * this.unitScale,
      pos.y * this.unitScale,
      radius * this.unitScale * this.scaleCancelRatio,
      arcStart,
      arcEnd
    );
    this.ctx.strokeStyle = palette.colors[color];
    this.ctx.stroke();
  }

  drawTriangle(
    triangle: Triangle,
    { color = "black" }: Partial<CanvasTriangleOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    this.ctx.moveTo(
      triangle.a.x * this.unitScale,
      triangle.a.y * this.unitScale
    );
    this.ctx.lineTo(
      triangle.b.x * this.unitScale,
      triangle.b.y * this.unitScale
    );
    this.ctx.lineTo(
      triangle.c.x * this.unitScale,
      triangle.c.y * this.unitScale
    );
    this.ctx.closePath();
    this.ctx.fillStyle = palette.colors[color];
    this.ctx.fill();
  }

  drawGrid(bounds: Rect, { lineWidth = 0.02 }: Partial<CanvasGridOpts> = {}) {
    const { palette } = this.app;
    this.ctx.strokeStyle = palette.colors.divider;
    this.ctx.lineWidth = lineWidth * this.unitScale * this.scaleCancelRatio;
    this.ctx.beginPath();
    const { left, right, top, bottom } = bounds.clone().scale(this.unitScale);
    for (let x = left + this.unitScale; x < right; x += this.unitScale) {
      this.ctx.moveTo(x, bottom);
      this.ctx.lineTo(x, top);
    }
    for (let y = bottom + this.unitScale; y < top; y += this.unitScale) {
      this.ctx.moveTo(left, y);
      this.ctx.lineTo(right, y);
    }
    this.ctx.stroke();
  }
}

/* drawDebug
 *
 * Draw debug information on the canvas
 */
class DrawDebugFeature extends Feature {
  dotRadius = 0.07;
  labelOffset = new Point(0.2, 0.2);
  labelFontSize = 0.3;
  labelFontFamily = "sans-serif";

  init() {
    this.settings.add(this, "dotRadius", 0, 1);
    this.settings.add(this.labelOffset, "x", -1, 1).name("labelOffset.x");
    this.settings.add(this.labelOffset, "y", -1, 1).name("labelOffset.y");
    this.settings.add(this, "labelFontSize");
  }

  point(position: Point, label: string, color: PaletteColor = "error") {
    const { canvas } = this.app;
    canvas.drawCircle(position, { radius: this.dotRadius, color });

    const labelPos = this.labelOffset
      .clone()
      .scale(canvas.scaleCancelRatio)
      .add(position);
    canvas.drawText(labelPos, label, {
      size: this.labelFontSize,
      font: this.labelFontFamily,
      color: color,
      align: "left",
    });
  }
}

/* grid
 *
 * Show a grid of lines as a coordinate system
 */
class GridFeature extends Feature {
  minCells = Point.from(16, 10);
  cells = Point.zero();
  cellSize = 0;
  bounds = Rect.zero();
  boundsMargin = Rect.zero();

  constructor(app: App, name: string) {
    super(app, name);
  }

  override update() {
    this.setCanvasScale();
    this.setBounds();
  }

  setCanvasScale() {
    const { canvas } = this.app;
    const { width, height } = canvas;
    const cellSizeX = width / this.minCells.x;
    const cellSizeY = height / this.minCells.y;
    this.cellSize = Math.min(cellSizeX, cellSizeY);
    this.cells.setXY(width, height).scale(1 / this.cellSize);
    canvas.setScale(this.cellSize);
  }

  setBounds() {
    this.bounds.bottomLeft.set(
      this.minCells.clone().scale(-0.5).add(this.boundsMargin.bottomLeft)
    );
    this.bounds.topRight.set(
      this.minCells.clone().scale(0.5).subtract(this.boundsMargin.topRight)
    );
  }
}
