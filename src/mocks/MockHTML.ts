export class MockHTMLCanvasElement {
  id = "";
  clientWidth = 0;
  clientHeight = 0;
  width = 0;
  height = 0;
  parentElement = null;
  getContext() {
    return new MockCanvasRenderingContext2D();
  }
  getBoundingClientRect() {
    return { width: 0, height: 0, top: 0, left: 0 };
  }
}

export class MockCanvasRenderingContext2D {
  lineWidth = 0;
  lineCap = "";
  strokeStyle = "";
  fillStyle = "";
  font = "";
  textBaseline = "";
  textAlign = "";
  imageSmoothingEnabled = false;
  fillRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  fill() {}
  arc() {}
  fillText() {}
  measureText() {}
  closePath() {}
  setLineDash() {}
  arcTo() {}
  setTransform() {}
}

