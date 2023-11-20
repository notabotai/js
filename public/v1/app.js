Math.sum = (arr) => arr.reduce((a, b) => a + b, 0);
/* Point
 *
 * Utility class for 2D points
 */
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
    static from(x, y) {
        return new Point(x, y);
    }
    static fromLength(len) {
        return new Point(len, 0);
    }
    static fromAngle(angle) {
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
    equals(point) {
        return this.x === point.x && this.y === point.y;
    }
    setXY(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    set(point) {
        this.x = point.x;
        this.y = point.y;
        return this;
    }
    clone() {
        return new Point(this.x, this.y);
    }
    distanceFrom(point) {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    addXY(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    add(point) {
        this.x += point.x;
        this.y += point.y;
        return this;
    }
    subtractXY(x, y) {
        this.x -= x;
        this.y -= y;
        return this;
    }
    subtract(point) {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    }
    scale(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    scaleXY(x, y) {
        this.x *= x;
        this.y *= y;
        return this;
    }
    scaleBy(point) {
        this.x *= point.x;
        this.y *= point.y;
        return this;
    }
    clampMinMax(min, max) {
        this.x = Math.min(Math.max(this.x, min.x), max.x);
        this.y = Math.min(Math.max(this.y, min.y), max.y);
        return this;
    }
    clamp(rect) {
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
    rotate(angle) {
        const len = this.len();
        const currentAngle = this.angle;
        this.x = len * Math.cos(currentAngle + angle);
        this.y = len * Math.sin(currentAngle + angle);
        return this;
    }
    equationWithSlope(slope) {
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
    perpendicularLineTo(line) {
        const endpointOnLine = this.perpendicularIntersectionOn(line);
        if (endpointOnLine === null) {
            return null;
        }
        return new Line(this.clone(), endpointOnLine);
    }
    perpendicularIntersectionOn(line) {
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
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
    static between(from, to) {
        return new Line(from.clone(), to.clone());
    }
    midpoint() {
        return new Point((this.from.x + this.to.x) / 2, (this.from.y + this.to.y) / 2);
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
    setFromTo(from, to) {
        this.from = from;
        this.to = to;
    }
    addXY(x, y) {
        this.from.addXY(x, y);
        this.to.addXY(x, y);
        return this;
    }
    subtractXY(x, y) {
        this.from.subtractXY(x, y);
        this.to.subtractXY(x, y);
        return this;
    }
    add(point) {
        this.addXY(point.x, point.y);
        return this;
    }
    scale(s) {
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
        return new Equation((this.to.y - this.from.y) / determinant, (this.from.x - this.to.x) / determinant, 1);
    }
    intersectionWith(line) {
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
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    intersectionWith(eqn) {
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
export class Rect {
    constructor(bottomLeft, topRight, parent = null) {
        this.parent = null;
        this.bottomLeft = bottomLeft;
        this.topRight = topRight;
        this.parent = parent;
    }
    static from(bottomLeft, topRight, parent = null) {
        return new Rect(bottomLeft, topRight, parent);
    }
    static zero() {
        return new Rect(Point.zero(), Point.zero());
    }
    static fromXY(x, y) {
        return new Rect(Point.from(x, y), Point.from(x, y));
    }
    static fromScalar(s) {
        return new Rect(Point.from(s, s), Point.from(s, s));
    }
    static fromPoint(point) {
        return new Rect(Point.zero(), point.clone());
    }
    hStack(widths, margin = null, spacing = 0) {
        const rects = [];
        let { left, right, top, bottom } = this.withMargin(margin);
        let x = left +
            (right - left - (widths.length - 1) * spacing - Math.sum(widths)) / 2;
        for (const width of widths) {
            rects.push(new Rect(Point.from(x, bottom), Point.from(x + width, top), this));
            x += width + spacing;
        }
        return rects;
    }
    hStackEqual(count, margin = null) {
        const rects = [];
        let { left, right, top, bottom } = this.withMargin(margin);
        const width = (right - left) / count;
        let x = left;
        for (let i = 0; i < count; i++) {
            rects.push(new Rect(Point.from(x, bottom), Point.from(x + width, top), this));
            x += width;
        }
        return rects;
    }
    vStack(heights, margin = null, spacing = 0) {
        const rects = [];
        let { left, right, top, bottom } = this.withMargin(margin);
        let y = bottom + (top - bottom - Math.sum(heights)) / 2;
        for (const height of heights) {
            rects.push(new Rect(Point.from(left, y), Point.from(right, y + height), this));
            y += height + spacing;
        }
        return rects;
    }
    vStackEqual(count, margin = null) {
        const rects = [];
        const { left, right, top, bottom } = this.withMargin(margin);
        const height = (top - bottom) / count;
        let y = bottom;
        for (let i = 0; i < count; i++) {
            rects.push(new Rect(Point.from(left, y), Point.from(right, y + height), this));
            y += height;
        }
        return rects;
    }
    withMargin(margin) {
        if (!margin) {
            return this;
        }
        return new Rect(this.bottomLeft.clone().add(margin.bottomLeft), this.topRight.clone().subtract(margin.topRight));
    }
    withMarginXY(x, y) {
        return new Rect(this.bottomLeft.clone().addXY(x, y), this.topRight.clone().subtractXY(x, y));
    }
    withMarginAll(margin) {
        return this.withMarginXY(margin, margin);
    }
    get width() {
        return this.topRight.x - this.bottomLeft.x;
    }
    get height() {
        return this.topRight.y - this.bottomLeft.y;
    }
    get center() {
        return new Point((this.bottomLeft.x + this.topRight.x) / 2, (this.bottomLeft.y + this.topRight.y) / 2);
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
    scale(s) {
        this.bottomLeft.scale(s);
        this.topRight.scale(s);
        return this;
    }
    intersect(rect) {
        this.bottomLeft.setXY(Math.max(this.bottomLeft.x, rect.bottomLeft.x), Math.max(this.bottomLeft.y, rect.bottomLeft.y));
        this.topRight.setXY(Math.min(this.topRight.x, rect.topRight.x), Math.min(this.topRight.y, rect.topRight.y));
        return this;
    }
    contains(point) {
        return (point.x >= this.bottomLeft.x &&
            point.x <= this.topRight.x &&
            point.y >= this.bottomLeft.y &&
            point.y <= this.topRight.y);
    }
}
/* Triangle
 *
 * Utility class for 2D triangles
 * a, b, and c are the coordinates of the three corners
 */
export class Triangle {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    static unit() {
        return Triangle.equilateral(1).rotate(-Math.PI / 2);
    }
    static from(a, b, c) {
        return new Triangle(a, b, c);
    }
    static equilateral(side) {
        const height = Math.sqrt(side * side - (side / 2) * (side / 2));
        return new Triangle(Point.from(0, 0), Point.from(side, 0), Point.from(side / 2, height)).translateXY(-side / 2, -height / 3);
    }
    static right(side) {
        return new Triangle(Point.from(0, 0), Point.from(side, 0), Point.from(0, side));
    }
    static zero() {
        return new Triangle(Point.zero(), Point.zero(), Point.zero());
    }
    translateXY(x, y) {
        this.a.addXY(x, y);
        this.b.addXY(x, y);
        this.c.addXY(x, y);
        return this;
    }
    translate(point) {
        return this.translateXY(point.x, point.y);
    }
    scale(s) {
        this.a.scale(s);
        this.b.scale(s);
        this.c.scale(s);
        return this;
    }
    clone() {
        return new Triangle(this.a.clone(), this.b.clone(), this.c.clone());
    }
    get centroid() {
        return new Point((this.a.x + this.b.x + this.c.x) / 3, (this.a.y + this.b.y + this.c.y) / 3);
    }
    rotate(angle, center = Point.zero()) {
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
    constructor(table, pos) {
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
    constructor(rowCount, colCount, bounds) {
        this.rowCount = rowCount;
        this.colCount = colCount;
        this.bounds = bounds;
    }
    indexToPos(index) {
        return Point.from(Math.floor(index / this.rowCount), index % this.colCount);
    }
    posToIndex(pos) {
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
    constructor() {
        this.paused = false;
        this.frame = 0;
        this.browserTime = 0;
        this.time = 0;
        this.dt = 0;
        this.features = [];
        this.debug = new Debug();
        this.settings = new Settings(this.debug);
        this.palette = new PaletteFeature(this, "palette");
        this.input = new InputFeature(this, "input");
        this.reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
        this.animate = new AnimateFeature(this, "animate");
        this.canvas = new CanvasFeature(this, "canvas");
        this.drawDebug = new DrawDebugFeature(this, "drawDebug");
        this.grid = new GridFeature(this, "grid");
        // requires app.settings.gui to have been initialized
        const appSettings = this.settings.gui.addFolder("app");
        appSettings.add(this, "paused").listen();
        appSettings.add(this, "frame").listen();
        appSettings.add(this, "browserTime").listen();
        appSettings.add(this, "time").listen();
        appSettings.add(this, "dt").listen();
        const updateLoop = (browserTime) => {
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
export class Feature {
    constructor(app, name) {
        this.app = app;
        this.name = name;
        this.app.features.push(this);
        this.settings = this.app.settings.gui.addFolder(this.name);
        this.debug = this.app.debug.getNamespace(this.name);
    }
    update() { }
    reset() { }
}
/* debug
 *
 * Debugging tools
 * Show debug information in an HTML element every frame
 * Press Alt+P to show the pose data in the console
 */
class Debug {
    constructor() {
        this.el = document.querySelector("#debug-el");
        this.lines = [];
        this.loggedValues = {};
        this.enabled = false;
        this.hasBreakpoint = false;
        this.enabled = this.getQueryParam("debug") === "true";
    }
    flush() {
        if (!this.enabled)
            return;
        this.displayCollectedLogLines();
        this.lines = [];
    }
    getNamespace(featureName) {
        return {
            log: (key, ...values) => this.log(featureName, key, ...values),
            logLive: (key, ...values) => this.logLive(featureName, key, ...values),
            logValue: (key, ...values) => this.logValue(featureName, key, ...values),
        };
    }
    // Show the collected lines of debug log in the HTML element
    displayCollectedLogLines() {
        const valuesStr = Object.keys(this.loggedValues)
            .map((k) => this.loggedValues[k])
            .join("\n");
        const linesStr = this.lines.join("\n");
        if (this.el)
            this.el.innerText = `${valuesStr}\n---\n${linesStr}`;
    }
    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    // Add a line of text to the debug log
    logLive(featureName, key, ...values) {
        if (!this.enabled)
            return;
        this.lines.push(this.getDebugText(featureName, key, values));
    }
    // Add a line of text to the debug log and print it to the console
    log(featureName, key, ...values) {
        console.log(featureName, key, ...values);
    }
    logValue(featureName, key, ...values) {
        this.loggedValues[`${featureName}: ${key}`] = this.getDebugText(featureName, key, values);
    }
    selectiveStringify(value, stringifier) {
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
    getDebugText(featureName, key, values, stringifier = () => undefined) {
        if (values.length === 0) {
            return `${featureName}: ${key}`;
        }
        const valuesStr = values
            .map((value) => {
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
    constructor(debug) {
        this.gui = (function () {
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
        if (!debug.enabled || !window.dat)
            return;
        this.gui = new window.dat.GUI();
        this.gui.useLocalStorage = true;
        this.gui.closed = true;
    }
}
/* palette
 *
 * App's color palette
 * - chosen: the palette currently in use
 * - options: the available palettes
 */
class PaletteFeature extends Feature {
    constructor(app, name) {
        super(app, name);
        this.chosen = "pastel";
        this.options = {
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
        this.colors = this.options[this.chosen];
        this.settings
            .add(this, "chosen", Object.keys(this.options))
            .onChange((paletteName) => this.set(paletteName));
    }
    set(paletteName) {
        this.chosen = paletteName;
        this.colors = this.options[this.chosen];
    }
}
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
    constructor(app, name) {
        super(app, name);
        this._keyDown = null;
        this._pointerDown = null;
        this._pointerMove = null;
        this._pointerUp = null;
        this.pointerScreen = Point.zero();
        this.pointer = Point.zero();
        this.dragStart = null;
        this.dragDelta = Point.zero();
        self.addEventListener("keydown", (e) => {
            const { altKey, code, ctrlKey, metaKey, shiftKey } = e;
            this._keyDown = { altKey, code, ctrlKey, metaKey, shiftKey };
            if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                e.preventDefault();
            }
        });
        self.addEventListener("mousedown", (e) => this.onPointerDown(e, e));
        self.addEventListener("touchstart", (e) => this.onPointerDown(e.touches[0], e));
        self.addEventListener("mousemove", (e) => this.onPointerMove(e, e));
        self.addEventListener("touchmove", (e) => this.onPointerMove(e.touches[0], e));
        self.addEventListener("mouseup", (e) => this.onPointerUp(e));
        self.addEventListener("touchend", (e) => this.onPointerUp(e));
    }
    update() {
        const { canvas } = this.app;
        if (this._pointerDown || this._pointerMove || this._pointerUp) {
            // Convert the pointer position from screen coordinates to canvas coordinates
            canvas.setCanvasPointerFromScreenCoords(this.pointer, this.pointerScreen);
        }
    }
    // Reset the variables, except .pointer, at the end of each frame
    reset() {
        this._keyDown = null;
        this._pointerDown = null;
        this._pointerMove = null;
        this._pointerUp = null;
    }
    onPointerDown(pos, originalEvent) {
        originalEvent.preventDefault();
        this.pointerScreen.setXY(pos.clientX, pos.clientY);
        this._pointerDown = this.pointer;
        if (!this.dragStart) {
            this.dragStart = this.pointer.clone();
        }
    }
    onPointerMove(pos, originalEvent) {
        originalEvent.preventDefault();
        this.pointerScreen.setXY(pos.clientX, pos.clientY);
        this._pointerMove = this.pointer;
        if (this.dragStart) {
            this.dragDelta.set(this.pointer).subtract(this.dragStart);
        }
    }
    onPointerUp(originalEvent) {
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
    constructor(app, name) {
        super(app, name);
        this.eventSource = new EventSource("/last-change");
        if (app.debug.enabled) {
            this.eventSource.onmessage = () => {
                this.eventSource.close();
                window.location.reload();
            };
        }
    }
}
class Easing {
    static linear(t) {
        return t;
    }
    static easeIn(t) {
        return t * t * t;
    }
    static easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    static easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}
/* animate
 *
 * Allow discrete property changes to show up as animations
 */
export class AnimateFeature extends Feature {
    constructor(app, name) {
        super(app, name);
        this.animations = [];
        this.animationDuration = 300;
        this.animationSpeed = 0.1;
        this.reachingThreshold = 0.01;
    }
    update() {
        const app = this.app;
        this.animations.forEach((anim) => {
            if (anim.progress >= 1)
                return;
            if (anim.type === "byTime") {
                const { startTime, duration, startValue, endValue, easing } = anim;
                if (app.time < startTime)
                    return;
                const timeElapsed = app.time - startTime;
                const timeRemaining = duration - timeElapsed;
                if (timeRemaining <= 0) {
                    anim.currentValue = endValue;
                    anim.progress = 1;
                }
                else {
                    anim.progress = Math.min(timeElapsed / duration, 1);
                    const easingFn = easing || Easing.linear;
                    const value = startValue + (endValue - startValue) * easingFn(anim.progress);
                    anim.currentValue = value;
                }
            }
            else if (anim.type === "bySpeed") {
                const { currentValue, endValue, speed } = anim;
                if (Math.abs(currentValue - endValue) < this.reachingThreshold) {
                    anim.currentValue = endValue;
                }
                else {
                    anim.currentValue = currentValue + speed * (endValue - currentValue);
                }
            }
        });
    }
    byTime(obj, property, opts) {
        const app = this.app;
        opts = opts || {};
        opts.duration =
            opts.duration === undefined ? this.animationDuration : opts.duration;
        opts.easing = opts.easing || Easing.easeOut;
        opts.randomDelay = opts.randomDelay || 0;
        opts.delay = opts.delay || 0;
        const animation = {
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
                if (animation.endValue === value)
                    return; // already at the target value
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
    bySpeed(obj, property, opts) {
        opts = opts || {};
        opts.speed = opts.speed || this.animationSpeed;
        opts.reachingThreshold = opts.reachingThreshold || this.reachingThreshold;
        const animation = {
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
                if (animation.endValue === value)
                    return; // already going to the target value
                animation.endValue = value;
                animation.progress = 0;
            },
        });
    }
    getAnimationIndex(obj, property) {
        return this.animations.findIndex((anim) => anim.obj === obj && anim.property === property);
    }
    removeAnimation(obj, property) {
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
/* canvas
 *
 * Manage the canvas element where the game is rendered
 */
class CanvasFeature extends Feature {
    constructor(app, name) {
        super(app, name);
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.toResizeNextFrame = true; // features dependent on canvas should resize on first frame
        this.unitScale = 100;
        this.defaultScale = 5;
        this.scaleCancelRatio = 1;
        this.el =
            document.querySelector("#canvas-el") ||
                document.createElement("canvas");
        if (this.el.parentElement === null) {
            this.el.id = "canvas-el";
            document.body.appendChild(this.el);
        }
        this.ctx = this.el.getContext("2d");
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
    update() {
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
        this.ctx.fillText = (text, x, y) => {
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
    setScale(scale) {
        this.scale = scale / this.unitScale;
        this.setInvertedYDirection();
    }
    setInvertedYDirection() {
        this.ctx.setTransform(this.scale, 0, 0, -this.scale, this.width / 2, this.height / 2);
    }
    resetYDirection() {
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.width / 2, this.height / 2);
    }
    setCanvasPointerFromScreenCoords(point, screenPoint) {
        const rect = this.el.getBoundingClientRect();
        const dpr = window.devicePixelRatio;
        const scale = this.scale * this.unitScale;
        point.setXY((dpr * (screenPoint.x - rect.left - this.width / dpr / 2)) / scale, (dpr * -(screenPoint.y - rect.top - this.height / dpr / 2)) / scale);
    }
    // consider the device to be in portrait mode if the aspect ratio is less than 1.2
    isPortrait() {
        return this.width / this.height < 1.2;
    }
    // this.scaleCancelRatio is used to cancel the scale factor of buttons and
    // interactive elements drawn bigger beyond so they're visible when grid is
    // large on a small screen
    distance(a, b) {
        return a.distanceFrom(b) / this.scaleCancelRatio;
    }
    // Draw methods
    drawCircle(pos, { radius = 1, color = "black", fixedRadius = true, } = {}) {
        const { palette } = this.app;
        this.ctx.beginPath();
        const r = fixedRadius ? radius : radius * this.scaleCancelRatio;
        this.ctx.arc(pos.x * this.unitScale, pos.y * this.unitScale, r * this.unitScale, 0, 2 * Math.PI);
        this.ctx.fillStyle = palette.colors[color];
        this.ctx.fill();
    }
    drawPoints(points, { radius = 1, color = "black" } = {}) {
        const { palette } = this.app;
        this.ctx.beginPath();
        points.forEach((point) => {
            const x = point.x * this.unitScale;
            const y = point.y * this.unitScale;
            this.ctx.moveTo(x, y);
            this.ctx.arc(x, y, radius * this.unitScale * this.scaleCancelRatio, 0, 2 * Math.PI);
        });
        this.ctx.fillStyle = palette.colors[color];
        this.ctx.fill();
    }
    drawText(pos, text, { size = 0.5, font = "sans-serif", color = "black", align = "center", baseline = "alphabetic", // top, hanging, middle. ideographic, bottom
    fixedSize = true, } = {}) {
        const { palette } = this.app;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        const fontSize = size * this.unitScale * (fixedSize ? this.scaleCancelRatio : 1);
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.fillStyle = palette.colors[color];
        this.ctx.fillText(text, pos.x * this.unitScale, pos.y * this.unitScale);
    }
    drawLine(line, { lineWidth = 1, color = "black", arrowSize = 0.15, arrowStart = false, arrowEnd = false, arrowColor = color, } = {}) {
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
            this.ctx.lineTo(l.from.x + arrowWidth * Math.cos(angle + Math.PI / 4), l.from.y + arrowWidth * Math.sin(angle + Math.PI / 4));
            this.ctx.moveTo(l.from.x, l.from.y);
            this.ctx.lineTo(l.from.x + arrowWidth * Math.cos(angle - Math.PI / 4), l.from.y + arrowWidth * Math.sin(angle - Math.PI / 4));
        }
        if (arrowEnd) {
            this.ctx.moveTo(l.to.x, l.to.y);
            this.ctx.lineTo(l.to.x + arrowWidth * Math.cos(angle + (Math.PI * 3) / 4), l.to.y + arrowWidth * Math.sin(angle + (Math.PI * 3) / 4));
            this.ctx.moveTo(l.to.x, l.to.y);
            this.ctx.lineTo(l.to.x + arrowWidth * Math.cos(angle - (Math.PI * 3) / 4), l.to.y + arrowWidth * Math.sin(angle - (Math.PI * 3) / 4));
        }
        this.ctx.strokeStyle = palette.colors[arrowColor];
        this.ctx.stroke();
    }
    drawRect(rect, { color = "black", lineWidth = 0.1, fill = false, fillColor = color, cornerRadius = 0, } = {}) {
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
        }
        else {
            this.ctx.moveTo(left, top);
            this.ctx.lineTo(right, top);
            this.ctx.lineTo(right, bottom);
            this.ctx.lineTo(left, bottom);
            this.ctx.lineTo(left, top);
        }
        this.ctx.strokeStyle = palette.colors[color];
        this.ctx.stroke();
        if (fill) {
            this.ctx.fillStyle = palette.colors[fillColor];
            this.ctx.fill();
        }
    }
    drawRing(pos, radius, { color = "black", lineWidth = 0.1, arcStart = 0, arcEnd = 2 * Math.PI, } = {}) {
        const { palette } = this.app;
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth * this.unitScale * this.scaleCancelRatio;
        this.ctx.arc(pos.x * this.unitScale, pos.y * this.unitScale, radius * this.unitScale * this.scaleCancelRatio, arcStart, arcEnd);
        this.ctx.strokeStyle = palette.colors[color];
        this.ctx.stroke();
    }
    drawTriangle(triangle, { color = "black" } = {}) {
        const { palette } = this.app;
        this.ctx.beginPath();
        this.ctx.moveTo(triangle.a.x * this.unitScale, triangle.a.y * this.unitScale);
        this.ctx.lineTo(triangle.b.x * this.unitScale, triangle.b.y * this.unitScale);
        this.ctx.lineTo(triangle.c.x * this.unitScale, triangle.c.y * this.unitScale);
        this.ctx.closePath();
        this.ctx.fillStyle = palette.colors[color];
        this.ctx.fill();
    }
    drawGrid(bounds, { lineWidth = 0.02 } = {}) {
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
    constructor() {
        super(...arguments);
        this.dotRadius = 0.07;
        this.labelOffset = new Point(0.2, 0.2);
        this.labelFontSize = 0.3;
        this.labelFontFamily = "sans-serif";
    }
    init() {
        this.settings.add(this, "dotRadius", 0, 1);
        this.settings.add(this.labelOffset, "x", -1, 1).name("labelOffset.x");
        this.settings.add(this.labelOffset, "y", -1, 1).name("labelOffset.y");
        this.settings.add(this, "labelFontSize");
    }
    point(position, label, color = "error") {
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
    constructor(app, name) {
        super(app, name);
        this.minCells = Point.from(16, 10);
        this.cells = Point.zero();
        this.cellSize = 0;
        this.bounds = Rect.zero();
        this.boundsMargin = Rect.zero();
    }
    update() {
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
        this.bounds.bottomLeft.set(this.minCells.clone().scale(-0.5).add(this.boundsMargin.bottomLeft));
        this.bounds.topRight.set(this.minCells.clone().scale(0.5).subtract(this.boundsMargin.topRight));
    }
}
