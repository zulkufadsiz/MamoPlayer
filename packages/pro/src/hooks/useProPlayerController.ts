import React from 'react';

import { requestPictureInPicture, subscribeToPipEvents } from '../pip/nativeBridge';
import type { AnalyticsConfig, AnalyticsEvent } from '../types/analytics';
import type { ProDebugConfig } from '../types/debug';
import type { PipConfig, PipEvent, PipState } from '../types/pip';
import type { ThumbnailsConfig } from '../types/thumbnails';
import type { TracksConfig, VideoQualityId } from '../types/tracks';

/** Rebuffer count at which an `excessive_buffering` event is emitted. */
const EXCESSIVE_BUFFERING_THRESHOLD = 3;

/**
 * The subset of core controller values consumed by `useProPlayerController`.
 * Pass the object returned by `useCorePlayerController` directly — only
 * `position`, `duration`, and `isBuffering` are read.
 */
export interface CorePositionValues {
  /** Current playback position in seconds. */
  position: number;
  /** Total media duration in seconds. */
  duration: number;
  /** Whether the player is stalled waiting for data. */
  isBuffering?: boolean;
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
  /**
   * Pre-computed initial quality ID (e.g. from `getInitialQualityId`).
   * Falls back to `tracks.defaultQualityId ?? 'auto'` when omitted.
   * Re-setting this value resets the selection without firing analytics.
   */
  initialQualityId?: VideoQualityId;
  /**
   * Pre-computed initial audio track ID.
   * Falls back to `tracks.defaultAudioTrackId` when omitted.
   * Re-setting this value resets the selection without firing analytics.
   */
  initialAudioTrackId?: string | null;
  /**
   * Pre-computed initial subtitle track ID (`'off'` to start with subtitles
   * disabled). Falls back to `tracks.defaultSubtitleTrackId` when omitted.
   * Re-setting this value resets the selection without firing analytics.
   */
  initialSubtitleTrackId?: string | 'off' | null;
  /**
   * Called whenever the PiP window state changes due to native events
   * (entering active / returning to inactive).
   * Wire this up to `ProMamoPlayerProps.onPipEvent` to forward state changes
   * to consumers.
   */
  onPipEvent?: (event: PipEvent) => void;
  /**
   * Ref to the underlying video element. When provided, `requestPip` will
   * first attempt the react-native-video `enterPictureInPicture()` API before
   * falling back to the native MamoCastModule bridge.
   */
  videoRef?: React.RefObject<{ enterPictureInPicture?: () => void } | null>;
  /**
   * Debug / diagnostics configuration.
   * When `enabled` is falsy (or omitted) `showDebugOverlay` is suppressed so
   * no debug state is surfaced to the UI layer.
   */
  debug?: ProDebugConfig;
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
  /** The most recent playback or ad error message, if any. */
  lastErrorMessage?: string;
  /** Number of times buffering has started since the player mounted. */
  rebufferCount: number;
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
  /** Toggle the debug information overlay on/off. */
  toggleDebugOverlay: () => void;
  /**
   * Record a playback or ad error message.
   * Call this from the playback or ads subsystem when an error occurs;
   * the message is surfaced via `lastErrorMessage`.
   */
  notifyError: (message: string) => void;
  /**
   * Update the `isAdPlaying` flag.
   * Call this from the ads subsystem when an ad starts or finishes.
   */
  setIsAdPlaying: (playing: boolean) => void;
  /**
   * Directly update the PiP window state.
   * Use this from the host component to reflect state changes that originate
   * outside the hook's native event subscription (e.g. optimistic 'entering'
   * from a custom `requestPip` implementation, or 'inactive' on error).
   */
  setPipState: (state: PipState) => void;
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

  const debugRef = React.useRef(options.debug);
  debugRef.current = options.debug;

  const videoRefRef = React.useRef(options.videoRef);
  videoRefRef.current = options.videoRef;

  // Keep mutable refs so callbacks always access the latest config values
  // without needing to be recreated on every render.
  const tracksRef = React.useRef(tracks);
  tracksRef.current = tracks;

  const analyticsRef = React.useRef(analytics);
  analyticsRef.current = analytics;

  const coreControllerRef = React.useRef(coreController);
  coreControllerRef.current = coreController;

  const onPipEventRef = React.useRef(options.onPipEvent);
  onPipEventRef.current = options.onPipEvent;

  // ─── Pro feature state ────────────────────────────────────────────────────

  const [currentQualityId, setCurrentQualityId] = React.useState<VideoQualityId>(
    options.initialQualityId ?? tracks?.defaultQualityId ?? 'auto',
  );

  const [currentSubtitleTrackId, setCurrentSubtitleTrackId] = React.useState<
    string | 'off' | null
  >(options.initialSubtitleTrackId ?? tracks?.defaultSubtitleTrackId ?? null);

  const [currentAudioTrackId, setCurrentAudioTrackId] = React.useState<string | null>(
    options.initialAudioTrackId ?? tracks?.defaultAudioTrackId ?? null,
  );

  const [isAdPlaying, setIsAdPlaying] = React.useState<boolean>(false);
  const [pipState, setPipState] = React.useState<PipState>('inactive');
  const [debugVisible, setDebugVisible] = React.useState<boolean>(false);
  const [lastErrorMessage, setLastErrorMessage] = React.useState<string | undefined>(undefined);
  const [rebufferCount, setRebufferCount] = React.useState<number>(0);

  // Track-state refs so analytics callbacks always read the latest selection
  // without triggering callback re-creation on every state change.
  const currentQualityIdRef = React.useRef(currentQualityId);
  currentQualityIdRef.current = currentQualityId;

  const currentSubtitleTrackIdRef = React.useRef(currentSubtitleTrackId);
  currentSubtitleTrackIdRef.current = currentSubtitleTrackId;

  const currentAudioTrackIdRef = React.useRef(currentAudioTrackId);
  currentAudioTrackIdRef.current = currentAudioTrackId;

  // Diagnostic-state refs so the analytics enrichment always reads the latest
  // values without invalidating memoised callbacks.
  const rebufferCountRef = React.useRef(rebufferCount);
  rebufferCountRef.current = rebufferCount;

  const lastErrorMessageRef = React.useRef(lastErrorMessage);
  lastErrorMessageRef.current = lastErrorMessage;

  // ─── Buffering counter ────────────────────────────────────────────────────
  // Increment rebufferCount on every false→true transition of isBuffering.

  const prevIsBufferingRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const isNowBuffering = coreController?.isBuffering ?? false;
    if (isNowBuffering && !prevIsBufferingRef.current) {
      setRebufferCount((c) => c + 1);
    }
    prevIsBufferingRef.current = isNowBuffering;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreController?.isBuffering]);

  // ─── Initial-ID sync effects ──────────────────────────────────────────────
  // When the host component recomputes initial IDs (e.g. because the `tracks`
  // prop changed), silently reset state without firing analytics events.

  React.useEffect(() => {
    if (options.initialQualityId != null) {
      setCurrentQualityId(options.initialQualityId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialQualityId]);

  React.useEffect(() => {
    if (options.initialAudioTrackId !== undefined) {
      setCurrentAudioTrackId(options.initialAudioTrackId ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialAudioTrackId]);

  React.useEffect(() => {
    if (options.initialSubtitleTrackId !== undefined) {
      setCurrentSubtitleTrackId(options.initialSubtitleTrackId ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialSubtitleTrackId]);

  // ─── PiP event subscription ────────────────────────────────────────────────

  React.useEffect(() => {
    if (!pip?.enabled) return;

    const unsubscribe = subscribeToPipEvents((eventName) => {
      if (eventName === 'mamo_pip_active') {
        setPipState('active');
        onPipEventRef.current?.({ state: 'active' });
      } else if (eventName === 'mamo_pip_exiting') {
        // The PiP window is animating back to inline; emit 'exiting' so the UI
        // can distinguish the transition from the fully-returned 'inactive' state.
        setPipState('exiting');
        onPipEventRef.current?.({ state: 'exiting' });
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
        // Diagnostic context is spread first so callers can still override
        // individual fields (e.g. lastErrorMessage on an error event).
        rebufferCount: rebufferCountRef.current,
        lastErrorMessage: lastErrorMessageRef.current,
        ...partial,
        timestamp: Date.now(),
        position: coreControllerRef.current?.position ?? 0,
        duration: coreControllerRef.current?.duration,
        sessionId: config.sessionId,
      });
    },
    [],
  );

  // ─── Diagnostics analytics effects ───────────────────────────────────────

  React.useEffect(() => {
    if (rebufferCount === EXCESSIVE_BUFFERING_THRESHOLD) {
      emitAnalytics({ type: 'excessive_buffering' });
    }
  }, [rebufferCount, emitAnalytics]);

  const prevDebugVisibleRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (prevDebugVisibleRef.current === debugVisible) return;
    prevDebugVisibleRef.current = debugVisible;
    emitAnalytics({ type: debugVisible ? 'debug_overlay_opened' : 'debug_overlay_closed' });
  }, [debugVisible, emitAnalytics]);

  // ─── Pro actions ──────────────────────────────────────────────────────────

  const changeQuality = React.useCallback(
    (qualityId: VideoQualityId) => {
      setCurrentQualityId(qualityId);
      emitAnalytics({
        type: 'quality_change',
        selectedQuality:
          tracksRef.current?.qualities?.find((q) => q.id === qualityId)?.label ?? qualityId,
        selectedSubtitle: currentSubtitleTrackIdRef.current ?? undefined,
        selectedAudioTrack: currentAudioTrackIdRef.current ?? undefined,
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
        selectedQuality: currentQualityIdRef.current,
        selectedAudioTrack: currentAudioTrackIdRef.current ?? undefined,
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
        selectedQuality: currentQualityIdRef.current,
        selectedSubtitle: currentSubtitleTrackIdRef.current ?? undefined,
      });
    },
    [emitAnalytics],
  );

  const requestPip = React.useCallback(() => {
    if (!pip?.enabled) return;

    // Optimistically transition to 'entering' while the native animation starts.
    setPipState('entering');
    onPipEventRef.current?.({ state: 'entering' });

    let lastError: unknown;

    if (typeof videoRefRef.current?.current?.enterPictureInPicture === 'function') {
      try {
        videoRefRef.current.current.enterPictureInPicture();
        return;
      } catch (error) {
        lastError = error;
      }
    }

    try {
      requestPictureInPicture();
      return;
    } catch (error) {
      lastError = error;
    }

    if (lastError) {
      const reason =
        lastError instanceof Error ? lastError.message : 'Unable to enter picture in picture.';
      console.warn(`[MamoPlayer Pro] ${reason}`);
      setPipState('inactive');
      onPipEventRef.current?.({ state: 'inactive', reason });
    }
  }, [pip?.enabled]);

  const showDebugOverlay = React.useCallback(() => {
    if (debugRef.current?.enabled) {
      setDebugVisible(true);
    }
  }, []);

  const hideDebugOverlay = React.useCallback(() => {
    setDebugVisible(false);
  }, []);

  const toggleDebugOverlay = React.useCallback(() => {
    setDebugVisible((v) => !v);
  }, []);

  const notifyError = React.useCallback((message: string) => {
    setLastErrorMessage(message);
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
    lastErrorMessage,
    rebufferCount,
    // Actions
    changeQuality,
    changeSubtitleTrack,
    changeAudioTrack,
    requestPip,
    showDebugOverlay,
    hideDebugOverlay,
    toggleDebugOverlay,
    notifyError,
    setIsAdPlaying,
    setPipState,
  };
}
