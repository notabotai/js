import { FeatureApp, Feature } from "../Feature.ts";
import { Point } from "../geom/Point.ts";
import { CanvasFeature } from "./CanvasFeature.ts";

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
export class InputFeature extends Feature {
  private _keyDown: InputKey = null;
  private _pointerDown: InputPointer = null;
  private _pointerMove: InputPointer = null;
  private _pointerUp: InputPointer = null;
  private pointerScreen = Point.zero();

  canvas: CanvasFeature;
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
  constructor(app: FeatureApp, name: string, canvas: CanvasFeature) {
    super(app, name);
    this.canvas = canvas;
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
    if (this._pointerDown || this._pointerMove || this._pointerUp) {
      // Convert the pointer position from screen coordinates to canvas coordinates
      this.canvas.setCanvasPointerFromScreenCoords(this.pointer, this.pointerScreen);
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
