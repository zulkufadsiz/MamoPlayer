import type { SettingsOverlayConfig } from '@mamoplayer/core';

/**
 * Extends the core settings overlay configuration with Pro-exclusive track
 * visibility toggles (quality, subtitles, audio).
 *
 * Pass this to `ProMamoPlayer`'s `settingsOverlay` prop.  Core's
 * `SettingsOverlayConfig` is unchanged and remains free of Pro concepts.
 */
export interface ProSettingsOverlayConfig extends SettingsOverlayConfig {
  /** Show the quality selector section. Defaults to `true`. */
  showQuality?: boolean;
  /** Show the subtitle track section. Defaults to `true`. */
  showSubtitles?: boolean;
  /** Show the audio track section. Defaults to `true`. */
  showAudioTracks?: boolean;
}
