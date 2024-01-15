/// <reference lib="dom" />

import { Point } from "./geom/Point.ts";
import { Line, Rect, Triangle } from "./geom/index.ts";

import { Debug, DebugLogger } from "./Debug.ts";
import { Settings } from "./Settings.ts";

import { PaletteFeature, PaletteColor } from "./feat/PaletteFeature.ts";
import { InputFeature } from "./feat/InputFeature.ts";
import { ReloadOnChangeFeature } from "./feat/ReloadOnChangeFeature.ts";

import type dat from "./vendor/dat.gui-0.7.9.d.ts";

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

    const fps: number = +(this.debug.getQueryParam("fps") || "30") || 30;
    const frameDelay = 1000 / fps;
    const updateLoop = () => {
      const browserTime = Date.now();
      if (this.paused) {
        this.dt = 0;
        this.browserTime = browserTime;
        return setTimeout(updateLoop, frameDelay);
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
      return setTimeout(updateLoop, frameDelay);
    };

    updateLoop();
  }
}

type AnimBase = {
  // deno-lint-ignore no-explicit-any
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

  // deno-lint-ignore no-explicit-any
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

  // deno-lint-ignore no-explicit-any
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

  // deno-lint-ignore no-explicit-any
  getAnimationIndex(obj: any, property: string) {
    return this.animations.findIndex(
      (anim: Anim) => anim.obj === obj && anim.property === property
    );
  }

  // deno-lint-ignore no-explicit-any
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
  fixedLineWidth: boolean;
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
export class CanvasFeature extends Feature {
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
      // deno-lint-ignore no-debugger
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
      fixedLineWidth = true,
    }: Partial<CanvasLineOpts> = {}
  ) {
    const { palette } = this.app;
    this.ctx.beginPath();
    const arrowWidth =
      arrowSize * this.unitScale * (fixedLineWidth ? this.scaleCancelRatio : 1);
    const l = line.clone().scale(this.unitScale);
    const angle = l.angle();
    this.ctx.lineWidth =
      lineWidth * this.unitScale * (fixedLineWidth ? this.scaleCancelRatio : 1);
    this.ctx.moveTo(l.from.x, l.from.y);
    this.ctx.lineTo(l.to.x, l.to.y);
    this.ctx.strokeStyle = palette.colors[color];
    if (arrowColor !== color) {
      this.ctx.stroke();
      this.ctx.beginPath();
    }
    if (arrowStart) {
      this.ctx.moveTo(
        l.from.x + arrowWidth * Math.cos(angle + Math.PI / 4),
        l.from.y + arrowWidth * Math.sin(angle + Math.PI / 4)
      );
      this.ctx.lineTo(l.from.x, l.from.y);
      this.ctx.lineTo(
        l.from.x + arrowWidth * Math.cos(angle - Math.PI / 4),
        l.from.y + arrowWidth * Math.sin(angle - Math.PI / 4)
      );
    }
    if (arrowEnd) {
      this.ctx.moveTo(
        l.to.x + arrowWidth * Math.cos(angle + (Math.PI * 3) / 4),
        l.to.y + arrowWidth * Math.sin(angle + (Math.PI * 3) / 4)
      );
      this.ctx.lineTo(l.to.x, l.to.y);
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
    if (lineWidth > 0) {
      this.ctx.strokeStyle = palette.colors[color];
      this.ctx.stroke();
    }
    if (fill) {
      this.ctx.fillStyle = palette.colors[fillColor];
      this.ctx.fill();
    }
  }

  drawRects(rects: Rect[], opts: Partial<CanvasRectOpts> = {}) {
    rects.forEach((rect: Rect) => this.drawRect(rect, opts));
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