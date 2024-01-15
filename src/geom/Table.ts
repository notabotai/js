import { Point } from "./Point.ts";
import { Rect } from "./Rect.ts";

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
