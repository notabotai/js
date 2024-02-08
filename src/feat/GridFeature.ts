import { Feature } from "../App.ts";
import { Point } from "../geom/Point.ts";
import { Rect } from "../geom/Rect.ts";

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
