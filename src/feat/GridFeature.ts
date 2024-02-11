import { FeatureApp, Feature } from "../Feature.ts";
import { Point } from "../geom/Point.ts";
import { Rect } from "../geom/Rect.ts";

import { CanvasFeature } from "./CanvasFeature.ts";

/* grid
 *
 * Show a grid of lines as a coordinate system
 */
export class GridFeature extends Feature {
  minCells = new Point(16, 10);
  cells = Point.zero();
  cellSize = 0;
  bounds = Rect.zero();
  boundsMargin = Rect.zero();

  canvas: CanvasFeature;

  constructor(app: FeatureApp, name: string, canvas: CanvasFeature) {
    super(app, name);
    this.canvas = canvas;
  }

  override update() {
    this.setCanvasScale();
    this.setBounds();
  }

  setCanvasScale() {
    const { width, height } = this.canvas;
    const cellSizeX = width / this.minCells.x;
    const cellSizeY = height / this.minCells.y;
    this.cellSize = Math.min(cellSizeX, cellSizeY);
    this.cells.setXY(width, height).scale(1 / this.cellSize);
    this.canvas.setScale(this.cellSize);
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
