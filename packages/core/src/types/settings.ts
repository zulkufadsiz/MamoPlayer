import type { ReactNode } from 'react';

/** A single selectable option inside an extra settings sub-menu. */
export interface SettingsOverlayExtraMenuOption {
  /** Unique identifier used as the value for `selectedOptionId`. */
  id: string;
  /** Human-readable label shown in the sub-menu list. */
  label: string;
}

/** A custom top-level entry added to the settings overlay by the host app. */
export interface SettingsOverlayExtraMenuItem {
  /** Stable key used for React reconciliation. */
  key: string;
  /** Label shown for the root menu entry. */
  title: string;
  /** Current value shown as a subtitle next to the title (e.g. `'English'`). */
  value?: string;
  /** Selectable options in the sub-menu. */
  options: SettingsOverlayExtraMenuOption[];
  /** The `id` of the currently selected option, if any. */
  selectedOptionId?: string;
  /** Called when the user picks an option. Receives the selected option's `id`. */
  onSelectOption: (optionId: string) => void;
}

/** Configuration for the slide-up settings overlay panel. */
export interface SettingsOverlayConfig {
  /** Show or hide the entire settings button and overlay. Defaults to true. */
  enabled?: boolean;
  /** Show the playback speed row. Defaults to true. */
  showPlaybackSpeed?: boolean;
  /** Show the mute toggle row. Defaults to true. */
  showMute?: boolean;
  /** Show the quality selector row (populated by ProMamoPlayer). Defaults to true. */
  showQuality?: boolean;
  /** Show the subtitle track row (populated by ProMamoPlayer). Defaults to true. */
  showSubtitles?: boolean;
  /** Show the audio track row (populated by ProMamoPlayer). Defaults to true. */
  showAudioTracks?: boolean;
  /** Optional React node rendered at the bottom of the settings panel. */
  extraItems?: ReactNode;
  /** Additional custom menu items with sub-menus rendered above `extraItems`. */
  extraMenuItems?: SettingsOverlayExtraMenuItem[];
}
