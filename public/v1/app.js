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
        this.reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
        this.animate = new AnimateFeature(this, "animate");
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
        this.el = document.querySelector("#debug-el .debug-log");
        this.lines = [];
        this.loggedValues = {};
        this.enabled = false;
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
        if (!debug.enabled)
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
                secondary: "#91C8E4",
                secondaryDark: "#4682A9",
                secondaryLight: "#A1CCD1",
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
