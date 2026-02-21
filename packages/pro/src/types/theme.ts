export type ThemeName = "light" | "dark" | "ott";

export interface PlayerColorPalette {
  background: string;
  backgroundOverlay: string;
  primary: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  danger: string;
  border: string;
  sliderTrack: string;
  sliderThumb: string;
}

export interface PlayerTypography {
  fontFamily?: string;
  fontSizeSmall: number;
  fontSizeMedium: number;
  fontSizeLarge: number;
}

export interface PlayerShape {
  borderRadiusSmall: number;
  borderRadiusMedium: number;
  borderRadiusLarge: number;
}

export interface PlayerThemeTokens {
  colors: PlayerColorPalette;
  typography: PlayerTypography;
  shape: PlayerShape;
}

export interface PlayerThemeConfig {
  name?: ThemeName;
  tokens: PlayerThemeTokens;
}
