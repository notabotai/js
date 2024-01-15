import { Table } from "./Table.ts";
import { Point } from "./Point.ts";

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
