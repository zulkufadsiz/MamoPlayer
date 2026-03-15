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

/** A single tappable row within a settings section. */
export interface SettingsItem {
  /** Unique identifier for this item. */
  id: string;
  /** Human-readable label displayed in the row. */
  label: string;
  /** Whether this item is currently selected (e.g. active quality / speed). */
  selected?: boolean;
  /** Called when the user taps the row. */
  onPress: () => void;
}

/** A labelled group of {@link SettingsItem} rows. */
export interface SettingsSection {
  /** Unique identifier for this section. */
  id: string;
  /** Heading displayed above the section's items. */
  title: string;
  /** Ordered list of items belonging to this section. */
  items: SettingsItem[];
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
  /**
   * Pre-built settings sections injected by the Pro player (quality, subtitles,
   * audio). Appended after the core sections (speed, mute) and any
   * `extraMenuItems`. Sections are omitted at the source when their track list
   * is empty, so no filtering is required here.
   */
  extraSections?: SettingsSection[];
}
