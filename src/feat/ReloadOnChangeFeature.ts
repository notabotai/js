import { App, Feature } from "../App.ts";

/* reloadOnChange
 *
 * Reload the page when server detects a change in the source code, only in dev mode
 */
export class ReloadOnChangeFeature extends Feature {
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
