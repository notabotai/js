import { FeatureApp, Feature } from "../Feature.ts";
import { Point } from "../geom/Point.ts";
import { Circle } from "../geom/Circle.ts";
import { Arc } from "../geom/Arc.ts";
import { Line } from "../geom/Line.ts";
import { Ray } from "../geom/Ray.ts";
import { Rect } from "../geom/Rect.ts";
import { Triangle } from "../geom/Triangle.ts";
import { PaletteFeature, PaletteColor } from "./PaletteFeature.ts";
import { MockHTMLCanvasElement, MockCanvasRenderingContext2D } from "../mocks/MockHTML.ts";

interface CanvasCircleOpts {
  color: PaletteColor;
  fixedRadius: boolean;
  arcStart: number;
  arcEnd: number;
}

interface CanvasArcOpts {
  color: PaletteColor;
  lineWidth: number;
  fixedLineWidth: boolean;
  fixedRadius: boolean;
}

interface CanvasPointOpts {
  color: PaletteColor;
  radius: number;
  fixedRadius: boolean;
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
  color: PaletteColor;
  lineWidth: number;
  fixedLineWidth: boolean;
  arrowSize: number;
  arrowStart: boolean;
  arrowEnd: boolean;
  arrowColor: PaletteColor;
  rounded: boolean;
}

interface CanvasRayOpts {
  lineWidth: number;
  color: PaletteColor;
  arrow: boolean;
  arrowSize: number;
  arrowColor: PaletteColor;
  length: number;
  fixedLineWidth: boolean;
  rounded: boolean;
}

interface CanvasRectOpts {
  color: PaletteColor;
  lineWidth: number;
  fixedLineWidth: boolean;
  fill: boolean;
  fillColor: PaletteColor;
  cornerRadius: number;
  dashed: boolean;
}

interface CanvasTriangleOpts {
  color: PaletteColor;
  lineWidth: number;
}

interface CanvasGridOpts {
  lineWidth: number;
  fixedLineWidth: boolean;
}

/* canvas
 *
 * Manage the canvas element where the game is rendered
 */
export class CanvasFeature extends Feature {
  el: HTMLCanvasElement | MockHTMLCanvasElement;
  ctx: CanvasRenderingContext2D | MockCanvasRenderingContext2D;
  width = 0;
  height = 0;
  scale = 1;
  toResizeNextFrame = true; // features dependent on canvas should resize on first frame
  unitScale = 100;
  defaultScale = 5;
  scaleCancelRatio = 1;

  palette: PaletteFeature;

  constructor(app: FeatureApp, name: string, palette: PaletteFeature) {
    super(app, name);
    this.palette = palette;
    if (typeof document !== "undefined") {
      this.el =
        document.querySelector<HTMLCanvasElement>("#canvas-el") ||
        document.createElement("canvas");
    } else {
      this.el = new MockHTMLCanvasElement();
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
    if (this.el !== null && this.toResizeNextFrame) {
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
    if (!this.ctx) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = this.palette.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.setInvertedYDirection();
  }

  scaleFor(fixed: boolean) {
    return fixed ? this.scaleCancelRatio : 1;
  }

  setCenteredCoordinates() {
    if (!this.ctx) return;
    this.setInvertedYDirection();
    const fillText = this.ctx.fillText;
    this.ctx.fillText = (text: string, x: number, y: number) => {
      this.resetYDirection();
      fillText.call(this.ctx, text, x, -y);
      this.setInvertedYDirection();
    };
  }

  setSize() {
    if (this.el === null) return;
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
    if (this.el === null) return;
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
    circle: Circle,
    { color = "black", fixedRadius = false }: Partial<CanvasCircleOpts> = {}
  ) {
    this.ctx.beginPath();
    const radius = circle.radius * this.scaleFor(fixedRadius);
    this.ctx.arc(
      circle.center.x * this.unitScale,
      circle.center.y * this.unitScale,
      radius * this.unitScale,
      0,
      2 * Math.PI
    );
    this.ctx.fillStyle = this.palette.colors[color];
    this.ctx.fill();
  }

  drawArc(
    arc: Arc,
    {
      color = "black",
      lineWidth = 0.1,
      fixedLineWidth = false,
      fixedRadius = false,
    }: Partial<CanvasArcOpts> = {}
  ) {
    this.ctx.beginPath();
    this.ctx.lineWidth =
      lineWidth * this.unitScale * this.scaleFor(fixedLineWidth);
    const radius = arc.radius * this.scaleFor(fixedRadius);
    this.ctx.arc(
      arc.center.x * this.unitScale,
      arc.center.y * this.unitScale,
      radius * this.unitScale,
      arc.startAngle,
      arc.endAngle
    );
    this.ctx.strokeStyle = this.palette.colors[color];
    this.ctx.stroke();
  }

  drawPoint(
    point: Point,
    {
      radius = 0.5,
      color = "black",
      fixedRadius = false,
    }: Partial<CanvasPointOpts> = {}
  ) {
    this.ctx.beginPath();
    const r = radius * this.scaleFor(fixedRadius);
    this._drawPoint(point, r);
    this.ctx.fillStyle = this.palette.colors[color];
    this.ctx.fill();
  }

  drawPoints(
    points: Point[],
    {
      radius = 0.5,
      color = "black",
      fixedRadius = false,
    }: Partial<CanvasPointOpts> = {}
  ) {
    const r = radius * this.scaleFor(fixedRadius);
    this.ctx.beginPath();
    points.forEach((point: Point) => this._drawPoint(point, r));
    this.ctx.fillStyle = this.palette.colors[color];
    this.ctx.fill();
  }

  _drawPoint(point: Point, radius: number) {
    const x = point.x * this.unitScale;
    const y = point.y * this.unitScale;
    this.ctx.moveTo(x, y);
    this.ctx.arc(x, y, radius * this.unitScale, 0, 2 * Math.PI);
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
      fixedSize = false,
    }: Partial<CanvasTextOpts> = {}
  ) {
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    const fontSize = size * this.unitScale * this.scaleFor(fixedSize);
    this.ctx.font = `${fontSize}px ${font}`;
    this.ctx.fillStyle = this.palette.colors[color];
    this.ctx.fillText(text, pos.x * this.unitScale, pos.y * this.unitScale);
  }

  drawLine(
    line: Line,
    {
      lineWidth = 0.1,
      color = "black",
      arrowSize = 0.15,
      arrowStart = false,
      arrowEnd = false,
      arrowColor = color,
      rounded = false,
      fixedLineWidth = false,
    }: Partial<CanvasLineOpts> = {}
  ) {
    this.ctx.beginPath();
    const arrowWidth =
      arrowSize * this.unitScale * this.scaleFor(fixedLineWidth);
    const l = line.clone().scale(this.unitScale);
    const angle = l.angle();
    this.ctx.lineWidth =
      lineWidth * this.unitScale * this.scaleFor(fixedLineWidth);
    this.ctx.lineCap = rounded ? "round" : "butt";
    this.ctx.moveTo(l.from.x, l.from.y);
    this.ctx.lineTo(l.to.x, l.to.y);
    this.ctx.strokeStyle = this.palette.colors[color];
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
    this.ctx.strokeStyle = this.palette.colors[arrowColor];
    this.ctx.stroke();
  }

  drawRay(
    ray: Ray,
    {
      lineWidth = 0.1,
      color = "black",
      arrow = false,
      arrowSize = 0.15,
      arrowColor = color,
      length = 0.8,
      fixedLineWidth = false,
      rounded = false,
    }: Partial<CanvasRayOpts> = {}
  ) {
    this.drawLine(Line.fromRay(ray, length), {
      lineWidth,
      color,
      arrowEnd: arrow,
      arrowSize,
      arrowColor,
      fixedLineWidth,
      rounded,
    });
  }

  drawRect(
    rect: Rect,
    {
      color = "black",
      lineWidth = 0.05,
      fixedLineWidth = false,
      fill = false,
      fillColor = color,
      cornerRadius = 0,
      dashed = false,
    }: Partial<CanvasRectOpts> = {}
  ) {
    this.ctx.beginPath();
    this.ctx.lineWidth =
      lineWidth * this.unitScale * this.scaleFor(fixedLineWidth);
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
      if (dashed) {
        this.ctx.setLineDash([lineWidth * this.unitScale * 2]);
      }
      this.ctx.strokeStyle = this.palette.colors[color];
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
    if (fill) {
      this.ctx.fillStyle = this.palette.colors[fillColor];
      this.ctx.fill();
    }
  }

  drawRects(rects: Rect[], opts: Partial<CanvasRectOpts> = {}) {
    rects.forEach((rect: Rect) => this.drawRect(rect, opts));
  }

  drawTriangle(
    triangle: Triangle,
    { color = "black" }: Partial<CanvasTriangleOpts> = {}
  ) {
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
    this.ctx.fillStyle = this.palette.colors[color];
    this.ctx.fill();
  }

  drawGrid(
    bounds: Rect,
    { lineWidth = 0.02, fixedLineWidth = false }: Partial<CanvasGridOpts> = {}
  ) {
    this.ctx.strokeStyle = this.palette.colors.divider;
    this.ctx.lineWidth =
      lineWidth * this.unitScale * this.scaleFor(fixedLineWidth);
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
