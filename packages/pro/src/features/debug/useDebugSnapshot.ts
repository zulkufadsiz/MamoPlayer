import React from 'react';

import type { DebugSnapshot } from '../../types/debug';

/**
 * Input values drawn from the current core and pro controller state.
 * Pass fields directly from each controller — no duplication into separate
 * state is required.
 */
export interface UseDebugSnapshotInput {
  // ── Core playback ─────────────────────────────────────────────────────────
  /** Whether the player is actively playing (not paused, not ended). */
  isPlaying: boolean;
  /** Whether the player is stalled waiting for data. */
  isBuffering: boolean;
  /** Current playback position in seconds. */
  position: number;
  /** Total media duration in seconds. `undefined` until known. */
  duration: number | undefined;
  /** How far the media has buffered ahead, in seconds. `undefined` until known. */
  buffered: number | undefined;

  // ── Pro track selections ──────────────────────────────────────────────────
  /** Currently active quality variant ID. */
  currentQualityId: string;
  /** Currently active subtitle track ID, `'off'` when disabled, or `null` for manifest default. */
  currentSubtitleTrackId: string | 'off' | null;
  /** Currently active audio track ID, or `null` for manifest default. */
  currentAudioTrackId: string | null;

  // ── Pro feature state ─────────────────────────────────────────────────────
  /** Whether an ad is currently playing. */
  isAdPlaying: boolean;
  /** Current picture-in-picture window state. */
  pipState: string;
  /** The most recent playback or ad error message, if any. */
  lastErrorMessage?: string;
  /** Number of times buffering has started since the player mounted. */
  rebufferCount: number;
}

function derivePlaybackState(isPlaying: boolean, isBuffering: boolean): string {
  if (isBuffering) return 'buffering';
  if (isPlaying) return 'playing';
  return 'paused';
}

/**
 * Builds a memoized {@link DebugSnapshot} derived entirely from the current
 * core and pro controller state — no separate source-of-truth state is needed.
 *
 * Re-computes only when one of the tracked values actually changes, making it
 * safe to pass directly to a debug overlay component without causing spurious
 * re-renders.
 *
 * @example
 * ```tsx
 * const snapshot = useDebugSnapshot({
 *   isPlaying: coreController.isPlaying,
 *   isBuffering: coreController.isBuffering,
 *   position: coreController.position,
 *   duration: coreController.duration,
 *   buffered: coreController.buffered,
 *   currentQualityId: proController.currentQualityId,
 *   currentSubtitleTrackId: proController.currentSubtitleTrackId,
 *   currentAudioTrackId: proController.currentAudioTrackId,
 *   isAdPlaying: proController.isAdPlaying,
 *   pipState: proController.pipState,
 *   lastErrorMessage: proController.lastErrorMessage,
 *   rebufferCount: proController.rebufferCount,
 * });
 * ```
 */
export function useDebugSnapshot(input: UseDebugSnapshotInput): DebugSnapshot {
  const {
    isPlaying,
    isBuffering,
    position,
    duration,
    buffered,
    currentQualityId,
    currentSubtitleTrackId,
    currentAudioTrackId,
    isAdPlaying,
    pipState,
    lastErrorMessage,
    rebufferCount,
  } = input;

  return React.useMemo<DebugSnapshot>(
    () => ({
      playbackState: derivePlaybackState(isPlaying, isBuffering),
      position,
      duration,
      buffered,
      selectedQuality: currentQualityId,
      selectedSubtitle: currentSubtitleTrackId ?? undefined,
      selectedAudioTrack: currentAudioTrackId ?? undefined,
      isBuffering,
      isAdPlaying,
      pipState,
      lastErrorMessage,
      rebufferCount,
    }),
    [
      isPlaying,
      isBuffering,
      position,
      duration,
      buffered,
      currentQualityId,
      currentSubtitleTrackId,
      currentAudioTrackId,
      isAdPlaying,
      pipState,
      lastErrorMessage,
      rebufferCount,
    ],
  );
}
