/// <reference lib="dom" />

import { Point } from "./geom/Point.ts";

type DebugValue = object | number | string | boolean | undefined;

export type DebugLogger = {
  log: (key: string, ...values: DebugValue[]) => void;
  logLive: (key: string, ...values: DebugValue[]) => void;
  logValue: (key: string, ...values: DebugValue[]) => void;
  breakpoint: () => void;
};

type Stringifier = (value: DebugValue) => string | undefined;

/* debug
 *
 * Debugging tools
 * Show debug information in an HTML element every frame
 * Press Alt+P to show the pose data in the console
 */
export class Debug {
  el: HTMLElement | null = null;
  lines: string[] = [];
  loggedValues: { [key: string]: string } = {};
  enabled = false;
  hasBreakpoint = false;

  constructor() {
    if (typeof document !== "undefined") {
      this.el = document.querySelector<HTMLElement>("#debug-el");
    }
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
      breakpoint: () => this.breakpoint(),
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
    const urlParams = new URLSearchParams(window.location?.search);
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
    if (value instanceof Point) {
      return value.toString();
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

  breakpoint() {
    this.hasBreakpoint = true;
    // deno-lint-ignore no-debugger
    debugger;
  }
}
