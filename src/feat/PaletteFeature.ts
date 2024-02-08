import { Feature } from "../App.ts";

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
  red: string;
  redTransparent: string;
  redDark: string;
  redLight: string;
  green: string;
  greenTransparent: string;
  greenDark: string;
  greenLight: string;
  blue: string;
  blueTransparent: string;
  blueDark: string;
  blueLight: string;
  yellow: string;
  yellowTransparent: string;
  yellowDark: string;
  yellowLight: string;
  purple: string;
  purpleTransparent: string;
  purpleDark: string;
  purpleLight: string;
  orange: string;
  orangeTransparent: string;
  orangeDark: string;
  orangeLight: string;
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
      grayLight: "#CFCFC4",
      red: "#FF6961", // https://www.colorhexa.com/ff6961
      redTransparent: "#FF696177",
      redDark: "#B00900",
      redLight: "#FFB4B0",
      green: "#61FF69",
      greenTransparent: "#61FF6977",
      greenDark: "#00B009",
      greenLight: "#B0FFB4",
      blue: "#6161FF",
      blueTransparent: "#6161FF77",
      blueDark: "#0000B0",
      blueLight: "#B0B0FF",
      yellow: "#FFB861",
      yellowTransparent: "#FFB86177",
      yellowDark: "#B06100",
      yellowLight: "#FFDBB0",
      purple: "#FF61F7",
      purpleTransparent: "#FF61F777",
      purpleDark: "#B000A7",
      purpleLight: "#FFB0FB",
      orange: "#FFB347",
      orangeTransparent: "#FFB34777",
      orangeDark: "#A36000",
      orangeLight: "#FFD9A3",
      white: "#F1F6F9",
    },
  };
  colors: Palette = this.options[this.chosen];
}
