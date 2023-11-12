import type dat from "../types/dat.gui";

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
  reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
  animate = new AnimateFeature(this, "animate");

  constructor() {
    // requires app.settings.gui to have been initialized
    const appSettings = this.settings.gui.addFolder("app");
    appSettings.add(this, "paused").listen();
    appSettings.add(this, "frame").listen();
    appSettings.add(this, "browserTime").listen();
    appSettings.add(this, "time").listen();
    appSettings.add(this, "dt").listen();

    const updateLoop = (browserTime: number) => {
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

type DebugValue = any;

type DebugLogger = {
  log: (key: string, ...values: DebugValue[]) => void;
  logLive: (key: string, ...values: DebugValue[]) => void;
  logValue: (key: string, ...values: DebugValue[]) => void;
};

type Stringifier = (value: DebugValue) => string | undefined;

/* debug
 *
 * Debugging tools
 * Show debug information in an HTML element every frame
 * Press Alt+P to show the pose data in the console
 */
class Debug {
  el = document.querySelector<HTMLElement>("#debug-el .debug-log");
  lines: string[] = [];
  loggedValues: { [key: string]: string } = {};
  enabled = false;

  constructor() {
    this.enabled = this.getQueryParam("debug") === "true";
  }

  flush() {
    if (!this.enabled) return;
    this.displayCollectedLogLines();
    this.lines = [];
  }

  getNamespace(featureName: string): DebugLogger {
    return {
      log: (key: string, ...values: DebugValue[]) =>
        this.log(featureName, key, ...values),
      logLive: (key: string, ...values: DebugValue[]) =>
        this.logLive(featureName, key, ...values),
      logValue: (key: string, ...values: DebugValue[]) =>
        this.logValue(featureName, key, ...values),
    };
  }

  // Show the collected lines of debug log in the HTML element
  displayCollectedLogLines() {
    const valuesStr = Object.keys(this.loggedValues)
      .map((k) => this.loggedValues[k])
      .join("\n");
    const linesStr = this.lines.join("\n");
    if (this.el) this.el.innerText = `${valuesStr}\n---\n${linesStr}`;
  }

  getQueryParam(name: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Add a line of text to the debug log
  logLive(featureName: string, key: string, ...values: DebugValue[]) {
    if (!this.enabled) return;
    this.lines.push(this.getDebugText(featureName, key, values));
  }

  // Add a line of text to the debug log and print it to the console
  log(featureName: string, key: string, ...values: DebugValue[]) {
    console.log(featureName, key, ...values);
  }

  logValue(featureName: string, key: string, ...values: DebugValue[]) {
    this.loggedValues[`${featureName}: ${key}`] = this.getDebugText(
      featureName,
      key,
      values
    );
  }

  selectiveStringify(
    value: DebugValue,
    stringifier: Stringifier
  ): string | undefined {
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    const customStringifierResult = stringifier(value);
    if (customStringifierResult !== undefined) {
      return customStringifierResult;
    }
    return;
  }

  getDebugText(
    featureName: string,
    key: string,
    values: DebugValue[],
    stringifier: Stringifier = () => undefined
  ) {
    if (values.length === 0) {
      return `${featureName}: ${key}`;
    }
    const valuesStr = values
      .map((value: DebugValue) => {
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
  gui: any = (function () {
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

  constructor(debug: Debug) {
    if (!debug.enabled) return;
    this.gui = new window.dat.GUI();
    this.gui.useLocalStorage = true;
    this.gui.closed = true;
  }
}

type PaletteName = "pastel";
type Palette = {
  background: string;
  surface: string;
  divider: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  black: string;
  gray: string;
  grayDark: string;
  grayLight: string;
  white: string;
};
export type PaletteColor = keyof Palette;

/* palette
 *
 * App's color palette
 * - chosen: the palette currently in use
 * - options: the available palettes
 */
class PaletteFeature extends Feature {
  chosen: PaletteName = "pastel";
  options: Record<PaletteName, Palette> = {
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
  colors: Palette = this.options[this.chosen];

  constructor(app: App, name: string) {
    super(app, name);
    this.settings
      .add(this, "chosen", Object.keys(this.options))
      .onChange((paletteName: PaletteName) => this.set(paletteName));
  }

  set(paletteName: PaletteName) {
    this.chosen = paletteName;
    this.colors = this.options[this.chosen];
  }
}

/* reloadOnChange
 *
 * Reload the page when server detects a change in the source code, only in dev mode
 */
class ReloadOnChangeFeature extends Feature {
  eventSource = new EventSource("/last-change");

  constructor(app: App, name: string) {
    super(app, name);
    if (app.debug.enabled) {
      this.eventSource.onmessage = () => {
        this.eventSource.close();
        window.location.reload();
      };
    }
  }
}

type AnimBase = {
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

  getAnimationIndex(obj: any, property: string) {
    return this.animations.findIndex(
      (anim: Anim) => anim.obj === obj && anim.property === property
    );
  }

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
