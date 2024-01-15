import { App, Feature } from "../App.ts";

type PaletteName = "pastel";
type Palette = {
  background: string;
  surface: string;
  divider: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryTransparent: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  secondaryTransparent: string;
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
export class PaletteFeature extends Feature {
  chosen: PaletteName = "pastel";
  options: Record<PaletteName, Palette> = {
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
