/** Built-in preset theme names. */
export type ThemeName = 'light' | 'dark' | 'ott';

/** Full colour palette used by the player UI. */
export interface PlayerColorPalette {
  /** Main player background colour. */
  background: string;
  /** Semi-transparent overlay drawn over the video during controls display. */
  backgroundOverlay: string;
  /** Primary brand/accent colour used for interactive elements. */
  primary: string;
  /** Text colour rendered on primary-coloured surfaces. */
  primaryText: string;
  /** Muted text colour used for labels and secondary information. */
  secondaryText: string;
  /** Highlight accent colour (e.g. active scrubber thumb). */
  accent: string;
  /** Colour for error states and destructive actions. */
  danger: string;
  /** General border and separator colour. */
  border: string;
  /** Inactive (un-played) slider track colour. */
  sliderTrack: string;
  /** Slider thumb (draggable knob) colour. */
  sliderThumb: string;
}

/** Font size and family tokens for player text elements. */
export interface PlayerTypography {
  /** Font family applied to all player text (falls back to system font when omitted). */
  fontFamily?: string;
  /** Font size (px) for small labels, captions, and timestamps. */
  fontSizeSmall: number;
  /** Font size (px) for standard body text and button labels. */
  fontSizeMedium: number;
  /** Font size (px) for prominent headings and overlays. */
  fontSizeLarge: number;
}

/** Border-radius tokens for player surfaces. */
export interface PlayerShape {
  /** Border radius (px) for small elements (e.g. pills, badges). */
  borderRadiusSmall: number;
  /** Border radius (px) for medium elements (e.g. cards, settings panel). */
  borderRadiusMedium: number;
  /** Border radius (px) for large elements (e.g. the player container itself). */
  borderRadiusLarge: number;
}

/** Complete design-token set for a player theme. */
export interface PlayerThemeTokens {
  /** Colour palette. */
  colors: PlayerColorPalette;
  /** Typography scale. */
  typography: PlayerTypography;
  /** Shape / border-radius scale. */
  shape: PlayerShape;
}

/**
 * Theme configuration passed to `ProMamoPlayer`.
 *
 * Either reference a built-in preset with `themeName`, provide a fully custom
 * set of `tokens`, or combine both to override individual token values on top
 * of a preset.
 */
export interface PlayerThemeConfig {
  /** Optional preset name. When provided alongside `tokens`, the preset is used as a base. */
  name?: ThemeName;
  /** Design token overrides. All fields are required; use `getDefaultTheme` to obtain a preset as a starting point. */
  tokens: PlayerThemeTokens;
}
