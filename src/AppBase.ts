/// <reference lib="dom" />

import { Debug } from "./Debug.ts";
import { Settings } from "./Settings.ts";
import { Feature, FeatureApp } from "./Feature.ts";

import { PaletteFeature } from "./feat/PaletteFeature.ts";
import { InputFeature } from "./feat/InputFeature.ts";
import { ReloadOnChangeFeature } from "./feat/ReloadOnChangeFeature.ts";
import { AnimateFeature } from "./feat/AnimateFeature.ts";
import { CanvasFeature } from "./feat/CanvasFeature.ts";
import { GridFeature } from "./feat/GridFeature.ts";

/* app
 *
 * Main application object
 * Initialize the different features at the start of the application
 * Call the update function for each feature on each frame
 * Reset the state of the application at the end of each frame
 */
export class AppBase implements FeatureApp {
  paused = false;
  frame = 0;
  browserTime = 0;
  time = 0;
  dt = 0;
  features: Feature[] = [];

  debug = new Debug();
  settings = new Settings(this.debug);

  palette = new PaletteFeature(this, "palette");
  canvas = new CanvasFeature(this, "canvas", this.palette);
  input = new InputFeature(this, "input", this.canvas);
  reloadOnChange = new ReloadOnChangeFeature(this, "reloadOnChange");
  animate = new AnimateFeature(this, "animate");
  grid = new GridFeature(this, "grid", this.canvas);

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
      if (typeof document !== "undefined") {
        return setTimeout(updateLoop, frameDelay);
      }
    };

    updateLoop();
  }
}

