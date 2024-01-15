import { Debug } from "./Debug.ts";

/* settings
 *
 * Settings for the app, editable in UI
 */
export class Settings {
  // deno-lint-ignore no-explicit-any
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
    if (!debug.enabled || !window.dat) return;
    this.gui = new window.dat.GUI();
    this.gui.useLocalStorage = true;
    this.gui.closed = true;
  }
}
