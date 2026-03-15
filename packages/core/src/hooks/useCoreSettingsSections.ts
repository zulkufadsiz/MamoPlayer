import React from 'react';

import type { SettingsOverlayExtraMenuItem, SettingsSection } from '../types/settings';

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;

const getSpeedLabel = (rate: number): string => (rate === 1 ? 'Normal' : `${rate}x`);

export interface UseCoreSettingsSectionsOptions {
  /** Current playback speed multiplier from the controller. */
  playbackRate: number;
  /** Current mute state from the controller. */
  isMuted: boolean;
  /** Action to set the playback speed from the controller. */
  setPlaybackRate: (rate: number) => void;
  /** Action to toggle mute from the controller. */
  toggleMute: () => void;
  /** Whether to include the Playback Speed section. */
  showPlaybackSpeed: boolean;
  /** Whether to include the Mute section. */
  showMute: boolean;
  /** Additional custom menu items to append as extra sections. */
  extraMenuItems?: SettingsOverlayExtraMenuItem[];
  /**
   * Pre-built sections injected by the Pro layer (quality, subtitles, audio).
   * Appended after the core sections and any `extraMenuItems`-derived sections.
   */
  extraSections?: SettingsSection[];
}

/**
 * Builds the ordered list of `SettingsSection` objects for the Core player
 * settings overlay.
 *
 * Derives section content directly from the values and actions exposed by
 * `useCorePlayerController`, making the sections always in sync with the
 * current playback state.
 */
export function useCoreSettingsSections({
  playbackRate,
  isMuted,
  setPlaybackRate,
  toggleMute,
  showPlaybackSpeed,
  showMute,
  extraMenuItems,
  extraSections,
}: UseCoreSettingsSectionsOptions): SettingsSection[] {
  return React.useMemo(() => {
    const sections: SettingsSection[] = [];

    if (showPlaybackSpeed) {
      sections.push({
        id: 'playback-speed',
        title: 'Playback Speed',
        items: SPEED_OPTIONS.map((rate) => ({
          id: String(rate),
          label: getSpeedLabel(rate),
          selected: playbackRate === rate,
          onPress: () => setPlaybackRate(rate),
        })),
      });
    }

    if (showMute) {
      sections.push({
        id: 'mute',
        title: 'Mute',
        items: [
          { id: 'unmuted', label: 'Unmuted', selected: !isMuted, onPress: toggleMute },
          { id: 'muted', label: 'Muted', selected: isMuted, onPress: toggleMute },
        ],
      });
    }

    for (const extraMenuItem of extraMenuItems ?? []) {
      sections.push({
        id: `extra-${extraMenuItem.key}`,
        title: extraMenuItem.title,
        items: extraMenuItem.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          selected: extraMenuItem.selectedOptionId === opt.id,
          onPress: () => extraMenuItem.onSelectOption(opt.id),
        })),
      });
    }

    for (const extraSection of extraSections ?? []) {
      sections.push(extraSection);
    }

    return sections;
  }, [playbackRate, isMuted, setPlaybackRate, toggleMute, showPlaybackSpeed, showMute, extraMenuItems, extraSections]);
}
