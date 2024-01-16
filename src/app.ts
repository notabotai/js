/// <reference lib="dom" />

import { Debug, DebugLogger } from "./Debug.ts";
import { Settings } from "./Settings.ts";

import { PaletteFeature } from "./feat/PaletteFeature.ts";
import { InputFeature } from "./feat/InputFeature.ts";
import { ReloadOnChangeFeature } from "./feat/ReloadOnChangeFeature.ts";
import { AnimateFeature } from "./feat/AnimateFeature.ts";
import { CanvasFeature } from "./feat/CanvasFeature.ts";
import { GridFeature } from "./feat/GridFeature.ts";

import type dat from "./vendor/dat.gui-0.7.9.d.ts";

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
  input = new InputFeature(this, "input");
  reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
  animate = new AnimateFeature(this, "animate");
  canvas = new CanvasFeature(this, "canvas");
  grid = new GridFeature(this, "grid");

  constructor() {
    // requires app.settings.gui to have been initialized
    const appSettings = this.settings.gui.addFolder("app");
    appSettings.add(this, "paused").listen();
    appSettings.add(this, "frame").listen();
    appSettings.add(this, "browserTime").listen();
    appSettings.add(this, "time").listen();
    appSettings.add(this, "dt").listen();

    const fps: number = +(this.debug.getQueryParam("fps") || "30") || 30;
    const frameDelay = 1000 / fps;
    const updateLoop = () => {
      const browserTime = Date.now();
      if (this.paused) {
        this.dt = 0;
        this.browserTime = browserTime;
        return setTimeout(updateLoop, frameDelay);
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
      return setTimeout(updateLoop, frameDelay);
    };

    updateLoop();
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
