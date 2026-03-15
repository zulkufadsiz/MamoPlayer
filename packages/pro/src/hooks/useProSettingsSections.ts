import type { SettingsSection } from '@mamoplayer/core';
import React from 'react';

import type { TracksConfig, VideoQualityId } from '../types/tracks';

export interface UseProSettingsSectionsOptions {
  /** Full track configuration from the Pro player's `tracks` prop. */
  tracks?: TracksConfig;
  /** Whether the Quality section is permitted by the settings config. */
  shouldShowQuality: boolean;
  /** Whether the Subtitles section is permitted by the settings config. */
  shouldShowSubtitles: boolean;
  /** Whether the Audio section is permitted by the settings config. */
  shouldShowAudio: boolean;
  /** Currently active quality variant ID from the Pro controller. */
  currentQualityId: VideoQualityId;
  /** Currently active subtitle track ID, `'off'`, or `null` from the Pro controller. */
  currentSubtitleTrackId: string | 'off' | null;
  /** Currently active audio track ID, or `null` from the Pro controller. */
  currentAudioTrackId: string | null;
  /** Action to switch quality from the Pro controller. */
  changeQuality: (id: VideoQualityId) => void;
  /** Action to switch subtitle track from the Pro controller. */
  changeSubtitleTrack: (id: string | 'off') => void;
  /** Action to switch audio track from the Pro controller. */
  changeAudioTrack: (id: string) => void;
}

/**
 * Builds the ordered list of Pro-specific `SettingsSection` objects for the
 * settings overlay.
 *
 * Sections are omitted entirely when the corresponding track list is absent or
 * empty, satisfying the "hide section when no tracks" requirement.
 */
export function useProSettingsSections({
  tracks,
  shouldShowQuality,
  shouldShowSubtitles,
  shouldShowAudio,
  currentQualityId,
  currentSubtitleTrackId,
  currentAudioTrackId,
  changeQuality,
  changeSubtitleTrack,
  changeAudioTrack,
}: UseProSettingsSectionsOptions): SettingsSection[] {
  return React.useMemo(() => {
    const sections: SettingsSection[] = [];

    // ─── Quality ──────────────────────────────────────────────────────────
    if (shouldShowQuality && tracks?.qualities?.length) {
      sections.push({
        id: 'quality',
        title: 'Quality',
        items: tracks.qualities.map((quality) => ({
          id: quality.id,
          label: quality.label,
          selected: currentQualityId === quality.id,
          onPress: () => changeQuality(quality.id),
        })),
      });
    }

    // ─── Subtitles ────────────────────────────────────────────────────────
    if (shouldShowSubtitles && tracks?.subtitleTracks?.length) {
      sections.push({
        id: 'subtitles',
        title: 'Subtitles',
        items: [
          {
            id: 'off',
            label: 'Off',
            selected: currentSubtitleTrackId === 'off' || currentSubtitleTrackId === null,
            onPress: () => changeSubtitleTrack('off'),
          },
          ...tracks.subtitleTracks.map((track) => ({
            id: track.id,
            label: track.label,
            selected: currentSubtitleTrackId === track.id,
            onPress: () => changeSubtitleTrack(track.id),
          })),
        ],
      });
    }

    // ─── Audio / Dub ──────────────────────────────────────────────────────
    if (shouldShowAudio && tracks?.audioTracks?.length) {
      sections.push({
        id: 'audio',
        title: 'Audio',
        items: tracks.audioTracks.map((track) => ({
          id: track.id,
          label: track.label,
          selected: currentAudioTrackId === track.id,
          onPress: () => changeAudioTrack(track.id),
        })),
      });
    }

    return sections;
  }, [
    tracks?.qualities,
    tracks?.subtitleTracks,
    tracks?.audioTracks,
    shouldShowQuality,
    shouldShowSubtitles,
    shouldShowAudio,
    currentQualityId,
    currentSubtitleTrackId,
    currentAudioTrackId,
    changeQuality,
    changeSubtitleTrack,
    changeAudioTrack,
  ]);
}
