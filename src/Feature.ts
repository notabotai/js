/// <reference lib="dom" />

import { Debug, DebugLogger } from "./Debug.ts";
import { Settings } from "./Settings.ts";
import type dat from "./vendor/dat.gui-0.7.9.d.ts";

export interface FeatureApp {
  paused: boolean;
  frame: number;
  browserTime: number;
  time: number;
  dt: number;
  features: Feature[];
  debug: Debug;
  settings: Settings;
};

export abstract class Feature {
  name: string;
  app: FeatureApp;
  debug: DebugLogger;
  settings: dat.GUI;

  constructor(app: FeatureApp, name: string) {
    this.app = app;
    this.name = name;
    app.features.push(this);
    this.settings = app.settings.gui.addFolder(this.name);
    this.debug = app.debug.getNamespace(this.name);
  }

  update(): void {}
  reset(): void {}
}

