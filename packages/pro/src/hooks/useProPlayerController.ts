import React from 'react';

import { requestPictureInPicture, subscribeToPipEvents } from '../pip/nativeBridge';
import type { AnalyticsConfig, AnalyticsEvent } from '../types/analytics';
import type { PipConfig, PipState } from '../types/pip';
import type { ThumbnailsConfig } from '../types/thumbnails';
import type { TracksConfig, VideoQualityId } from '../types/tracks';

/**
 * The subset of core controller values consumed by `useProPlayerController`.
 * Pass the object returned by `useCorePlayerController` directly — only
 * `position` and `duration` are read.
 */
export interface CorePositionValues {
  /** Current playback position in seconds. */
  position: number;
  /** Total media duration in seconds. */
  duration: number;
}

export interface UseProPlayerControllerOptions {
  /** Video track configuration: quality variants, audio tracks, and subtitle tracks. */
  tracks?: TracksConfig;
  /** Picture-in-picture configuration. */
  pip?: PipConfig;
  /**
   * Thumbnail preview configuration for the scrubber.
   * Accepted here so callers can pass the full Pro config bag; consumed
   * externally by the UI layer, not by the hook itself.
   */
  thumbnails?: ThumbnailsConfig;
  /** Analytics reporting configuration. */
  analytics?: AnalyticsConfig;
  /**
   * Values from `useCorePlayerController` used to enrich analytics events
   * with the current playback position and duration.
   */
  coreController?: CorePositionValues;
}

/** Pro-specific player state managed by this hook. */
export interface ProPlayerState {
  /** Currently active quality variant ID. Defaults to `'auto'`. */
  currentQualityId: VideoQualityId;
  /**
   * Currently active subtitle track ID, `'off'` when subtitles are disabled,
   * or `null` when falling back to the manifest default.
   */
  currentSubtitleTrackId: string | 'off' | null;
  /**
   * Currently active audio track ID, or `null` when using the manifest
   * default.
   */
  currentAudioTrackId: string | null;
  /** Whether an ad is currently playing. */
  isAdPlaying: boolean;
  /** Current picture-in-picture window state. */
  pipState: PipState;
  /** Whether the debug information overlay is visible. */
  debugVisible: boolean;
}

/** Pro-specific player actions exposed by this hook. */
export interface ProPlayerActions {
  /** Switch to the specified quality variant. */
  changeQuality: (qualityId: VideoQualityId) => void;
  /** Select a subtitle track by ID, or pass `'off'` to disable subtitles. */
  changeSubtitleTrack: (id: string | 'off') => void;
  /** Switch to the specified audio track. */
  changeAudioTrack: (id: string) => void;
  /**
   * Request the player to enter picture-in-picture mode.
   * No-op when `pip.enabled` is `false` or unset.
   */
  requestPip: () => void;
  /** Show the debug information overlay. */
  showDebugOverlay: () => void;
  /** Hide the debug information overlay. */
  hideDebugOverlay: () => void;
  /**
   * Update the `isAdPlaying` flag.
   * Call this from the ads subsystem when an ad starts or finishes.
   */
  setIsAdPlaying: (playing: boolean) => void;
}

/** Full controller object returned by `useProPlayerController`. */
export type ProPlayerController = ProPlayerState & ProPlayerActions;

/**
 * Manages Pro-exclusive player feature state and exposes the corresponding
 * actions.
 *
 * This hook is intentionally scoped to Pro-only concerns — quality selection,
 * subtitle / audio track switching, PiP, ad-playing state, and the debug
 * overlay. Core playback logic (play/pause, seek, buffering, …) lives in
 * `useCorePlayerController` from `@mamoplayer/core`.
 *
 * Wire up `coreController` to have analytics events automatically enriched
 * with the current playback position and duration.
 *
 * @example
 * ```tsx
 * const coreController = useCorePlayerController({ videoRef });
 * const proController = useProPlayerController({
 *   tracks,
 *   pip,
 *   thumbnails,
 *   analytics,
 *   coreController,
 * });
 *
 * // Change quality and let the hook fire the analytics event automatically:
 * proController.changeQuality('1080p');
 * ```
 */
export function useProPlayerController(options: UseProPlayerControllerOptions): ProPlayerController {
  const { tracks, pip, analytics, coreController } = options;

  // Keep mutable refs so callbacks always access the latest config values
  // without needing to be recreated on every render.
  const tracksRef = React.useRef(tracks);
  tracksRef.current = tracks;

  const analyticsRef = React.useRef(analytics);
  analyticsRef.current = analytics;

  const coreControllerRef = React.useRef(coreController);
  coreControllerRef.current = coreController;

  // ─── Pro feature state ────────────────────────────────────────────────────

  const [currentQualityId, setCurrentQualityId] = React.useState<VideoQualityId>(
    tracks?.defaultQualityId ?? 'auto',
  );

  const [currentSubtitleTrackId, setCurrentSubtitleTrackId] = React.useState<
    string | 'off' | null
  >(tracks?.defaultSubtitleTrackId ?? null);

  const [currentAudioTrackId, setCurrentAudioTrackId] = React.useState<string | null>(
    tracks?.defaultAudioTrackId ?? null,
  );

  const [isAdPlaying, setIsAdPlaying] = React.useState<boolean>(false);
  const [pipState, setPipState] = React.useState<PipState>('inactive');
  const [debugVisible, setDebugVisible] = React.useState<boolean>(false);

  // ─── PiP event subscription ────────────────────────────────────────────────

  React.useEffect(() => {
    if (!pip?.enabled) return;

    const unsubscribe = subscribeToPipEvents((eventName) => {
      if (eventName === 'mamo_pip_active') {
        setPipState('active');
      } else if (eventName === 'mamo_pip_exiting') {
        // The PiP window is animating back to inline; treat as inactive once
        // the transition begins so the UI reflects inline playback immediately.
        setPipState('inactive');
      }
    });

    return unsubscribe;
  }, [pip?.enabled]);

  // ─── Analytics helper ─────────────────────────────────────────────────────

  const emitAnalytics = React.useCallback(
    (partial: Omit<AnalyticsEvent, 'timestamp' | 'position' | 'duration' | 'sessionId'>) => {
      const config = analyticsRef.current;
      if (!config) return;

      config.onEvent({
        ...partial,
        timestamp: Date.now(),
        position: coreControllerRef.current?.position ?? 0,
        duration: coreControllerRef.current?.duration,
        sessionId: config.sessionId,
      });
    },
    [],
  );

  // ─── Pro actions ──────────────────────────────────────────────────────────

  const changeQuality = React.useCallback(
    (qualityId: VideoQualityId) => {
      setCurrentQualityId(qualityId);
      emitAnalytics({
        type: 'quality_change',
        selectedQuality:
          tracksRef.current?.qualities?.find((q) => q.id === qualityId)?.label ?? qualityId,
      });
    },
    [emitAnalytics],
  );

  const changeSubtitleTrack = React.useCallback(
    (id: string | 'off') => {
      setCurrentSubtitleTrackId(id);
      emitAnalytics({
        type: 'subtitle_change',
        selectedSubtitle:
          id === 'off'
            ? 'off'
            : (tracksRef.current?.subtitleTracks?.find((t) => t.id === id)?.label ?? id),
      });
    },
    [emitAnalytics],
  );

  const changeAudioTrack = React.useCallback(
    (id: string) => {
      setCurrentAudioTrackId(id);
      emitAnalytics({
        type: 'audio_track_change',
        audioTrackId: id,
        selectedAudioTrack:
          tracksRef.current?.audioTracks?.find((t) => t.id === id)?.label ?? id,
      });
    },
    [emitAnalytics],
  );

  const requestPip = React.useCallback(() => {
    if (!pip?.enabled) return;
    // Optimistically transition to 'entering' while the native animation starts.
    setPipState('entering');
    requestPictureInPicture();
  }, [pip?.enabled]);

  const showDebugOverlay = React.useCallback(() => {
    setDebugVisible(true);
  }, []);

  const hideDebugOverlay = React.useCallback(() => {
    setDebugVisible(false);
  }, []);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // State
    currentQualityId,
    currentSubtitleTrackId,
    currentAudioTrackId,
    isAdPlaying,
    pipState,
    debugVisible,
    // Actions
    changeQuality,
    changeSubtitleTrack,
    changeAudioTrack,
    requestPip,
    showDebugOverlay,
    hideDebugOverlay,
    setIsAdPlaying,
  };
}
