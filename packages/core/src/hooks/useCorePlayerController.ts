import React from 'react';
import { Animated, Easing } from 'react-native';
import type {
    OnBufferData,
    OnLoadData,
    OnProgressData,
    OnSeekData,
    OnVideoErrorData,
    VideoRef,
} from 'react-native-video';

import type { ControlsConfig } from '../MamoPlayer';
import type { PlaybackEvent } from '../types/playback';

const DEFAULT_AUTO_HIDE_DELAY_MS = 3000;

export interface UseCorePlayerControllerOptions {
  /** Ref to the underlying `react-native-video` `VideoRef`. */
  videoRef: React.RefObject<VideoRef | null>;
  /** Controls bar auto-hide configuration. */
  controls?: ControlsConfig;
  /** Start playback automatically when the video loads. Defaults to `true`. */
  autoPlay?: boolean;
  /**
   * Controlled paused state. When provided the controller operates as a
   * controlled component and defers to this value.
   */
  paused?: boolean;
  /**
   * Whether the settings overlay has at least one visible section.
   * Used to guard the `openSettings` action so it does nothing when there is
   * nothing to show.
   */
  hasVisibleSettingsSections?: boolean;
  /** Called for every playback lifecycle event (play, pause, seek, error, …). */
  onPlaybackEvent?: (event: PlaybackEvent) => void;
  /** Called whenever the player enters or exits fullscreen. */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Called once when a scrub gesture begins (before any position change). */
  onScrubStart?: () => void;
  /** Called on every scrub move with the candidate seek time in seconds. */
  onScrubMove?: (time: number) => void;
  /** Called when the scrub gesture ends with the final seek time in seconds. */
  onScrubEnd?: (time: number) => void;
}

/** Complete state snapshot exposed by the controller. */
export interface CorePlayerState {
  /** Whether the player is actively playing (not paused, not ended). */
  isPlaying: boolean;
  /** Whether the player is stalled waiting for data. */
  isBuffering: boolean;
  /** Whether audio output is muted. */
  isMuted: boolean;
  /** Whether the player is in fullscreen mode. */
  isFullscreen: boolean;
  /** Current playback speed multiplier (e.g. `1`, `1.5`, `2`). */
  playbackRate: number;
  /** Current playback position in seconds. */
  position: number;
  /** Total media duration in seconds. */
  duration: number;
  /** How far the media has buffered ahead, in seconds. `undefined` until known. */
  buffered: number | undefined;
  /** Whether the controls overlay is currently visible. */
  controlsVisible: boolean;
  /** Whether the settings panel is open. */
  isSettingsOpen: boolean;
  /**
   * The resolved `paused` value to forward to the `<Video>` component's
   * `paused` prop. Combines the internal play/pause state with any externally
   * controlled `paused` override.
   */
  resolvedPaused: boolean;
  /** Animated value driving the controls overlay opacity — wire directly to an `<Animated.View>`. */
  controlsOpacityAnim: Animated.Value;
}

/** Player action callbacks exposed by the controller. */
export interface CorePlayerActions {
  /** Resume playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle between playing and paused. */
  togglePlayPause: () => void;
  /** Seek to an absolute time in seconds. */
  seekTo: (time: number) => void;
  /** Seek forward by `seconds` (default `10`). */
  seekForward: (seconds?: number) => void;
  /** Seek backward by `seconds` (default `10`). */
  seekBackward: (seconds?: number) => void;
  /** Toggle audio mute. */
  toggleMute: () => void;
  /** Set the playback speed multiplier. */
  setPlaybackRate: (rate: number) => void;
  /** Toggle fullscreen on/off. */
  toggleFullscreen: () => void;
  /** Reveal the controls overlay immediately. */
  showControls: () => void;
  /** Dismiss the controls overlay. */
  hideControls: () => void;
  /** Toggle controls visibility: show when hidden, hide when visible. */
  toggleControls: () => void;
  /**
   * Start (or restart) the auto-hide countdown. Safe to call from custom UI
   * after any interaction that should reset the inactivity timer.
   * No-op when `autoHide` is disabled, the video is paused, the user is
   * scrubbing, or the settings overlay is open.
   */
  scheduleAutoHide: () => void;
  /** Open the settings panel (no-op when `hasVisibleSettingsSections` is falsy). */
  openSettings: () => void;
  /** Close the settings panel. */
  closeSettings: () => void;
}

/**
 * Handlers that should be forwarded to the `<Video>` component and the
 * `<Timeline>` / surface gesture handlers so the controller can keep its
 * internal state in sync.
 */
export interface CorePlayerHandlers {
  handleLoad: (data: OnLoadData) => void;
  handleProgress: (data: OnProgressData) => void;
  handleEnd: () => void;
  handleError: (error: OnVideoErrorData) => void;
  handleSeek: (data: OnSeekData) => void;
  handleBuffer: (data: OnBufferData) => void;
  handleScrubStart: () => void;
  handleScrubSeek: (time: number) => void;
  handleScrubEnd: (time: number) => void;
  /** Call when the user taps the video surface (outside of controls). */
  handleSurfacePress: () => void;
}

/** Full controller object returned by `useCorePlayerController`. */
export type CorePlayerController = CorePlayerState & CorePlayerActions & CorePlayerHandlers;

/**
 * Centralises Core player logic: UI state, playback actions, auto-hide
 * controls, and scrub management.
 *
 * Wire up the returned `CorePlayerHandlers` to the `<Video>` component events
 * and the scrub/surface callbacks. Consume `CorePlayerState` and
 * `CorePlayerActions` in your UI layer.
 *
 * @example
 * ```tsx
 * const controller = useCorePlayerController({ videoRef, controls, onPlaybackEvent });
 *
 * <Video
 *   ref={videoRef}
 *   paused={controller.resolvedPaused}
 *   rate={controller.playbackRate}
 *   muted={controller.isMuted}
 *   onLoad={controller.handleLoad}
 *   onProgress={controller.handleProgress}
 *   onEnd={controller.handleEnd}
 *   onError={controller.handleError}
 *   onSeek={controller.handleSeek}
 *   onBuffer={controller.handleBuffer}
 * />
 * ```
 */
export function useCorePlayerController(options: UseCorePlayerControllerOptions): CorePlayerController {
  const {
    videoRef,
    controls,
    autoPlay = true,
    paused,
    hasVisibleSettingsSections = true,
    onPlaybackEvent,
    onFullscreenChange,
    onScrubStart: onScrubStartProp,
    onScrubMove: onScrubMoveProp,
    onScrubEnd: onScrubEndProp,
  } = options;

  // ─── UI state ────────────────────────────────────────────────────────────

  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isBuffering, setIsBuffering] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = React.useState<number>(1);
  const [position, setPosition] = React.useState<number>(0);
  const [duration, setDuration] = React.useState<number>(0);
  const [buffered, setBuffered] = React.useState<number | undefined>(undefined);
  const [controlsVisible, setControlsVisible] = React.useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  /**
   * Internal paused override — set when the Core layer needs to temporarily
   * force a paused state (e.g. pause during scrubbing) independently of the
   * externally controlled `paused` prop.
   */
  const [pausedOverride, setPausedOverride] = React.useState<boolean | null>(null);

  // ─── Internal refs ────────────────────────────────────────────────────────

  const durationRef = React.useRef<number>(0);
  const positionRef = React.useRef<number>(0);
  const isScrubbingRef = React.useRef<boolean>(false);
  const wasPlayingBeforeScrubRef = React.useRef<boolean>(false);
  const isBufferingRef = React.useRef<boolean>(false);
  const hasLoadedRef = React.useRef<boolean>(false);
  const autoHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacityAnim = React.useRef(new Animated.Value(1));

  // ─── Config resolution ────────────────────────────────────────────────────

  const resolvedAutoHide = controls?.autoHide ?? true;
  const resolvedAutoHideDelay = controls?.autoHideDelay ?? DEFAULT_AUTO_HIDE_DELAY_MS;

  // ─── Resolved paused ─────────────────────────────────────────────────────

  const resolvedPaused = pausedOverride ?? paused ?? !isPlaying;
  // Keep a ref in sync so scrub callbacks can read the latest value without
  // becoming stale inside long-lived closures.
  const resolvedPausedRef = React.useRef<boolean>(resolvedPaused);
  resolvedPausedRef.current = resolvedPaused;

  // Reset the internal override whenever the external controlled prop changes
  // so the external prop retakes precedence.
  React.useEffect(() => {
    setPausedOverride(null);
  }, [paused]);

  // ─── Event emission ───────────────────────────────────────────────────────

  const emit = React.useCallback(
    (
      event: Omit<PlaybackEvent, 'timestamp' | 'duration' | 'position'> & {
        duration?: number;
        position?: number;
      },
    ) => {
      onPlaybackEvent?.({
        ...event,
        timestamp: Date.now(),
        duration: event.duration ?? durationRef.current,
        position: event.position ?? positionRef.current,
      });
    },
    [onPlaybackEvent],
  );

  // ─── Controls auto-hide ───────────────────────────────────────────────────

  const clearAutoHideTimer = React.useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const showControls = React.useCallback(() => {
    setControlsVisible(true);
    Animated.timing(controlsOpacityAnim.current, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideControls = React.useCallback(() => {
    Animated.timing(controlsOpacityAnim.current, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setControlsVisible(false);
      }
    });
  }, []);

  const scheduleControlsAutoHide = React.useCallback(() => {
    clearAutoHideTimer();

    if (
      !resolvedAutoHide ||
      resolvedPausedRef.current ||
      isSettingsOpen ||
      isScrubbingRef.current ||
      !controlsVisible
    ) {
      return;
    }

    autoHideTimerRef.current = setTimeout(hideControls, resolvedAutoHideDelay);
  }, [clearAutoHideTimer, controlsVisible, hideControls, isSettingsOpen, resolvedAutoHide, resolvedAutoHideDelay]);

  const toggleControls = React.useCallback(() => {
    if (controlsVisible) {
      hideControls();
    } else {
      showControls();
      scheduleControlsAutoHide();
    }
  }, [controlsVisible, hideControls, scheduleControlsAutoHide, showControls]);

  // Keep controls visible while paused or while settings are open, and
  // cancel any pending auto-hide timer so controls cannot disappear.
  React.useEffect(() => {
    if (resolvedPaused || isSettingsOpen) {
      clearAutoHideTimer();
      showControls();
    }
  }, [clearAutoHideTimer, isSettingsOpen, resolvedPaused, showControls]);

  // Re-schedule the auto-hide whenever relevant state changes.
  React.useEffect(() => {
    scheduleControlsAutoHide();
    return clearAutoHideTimer;
  }, [clearAutoHideTimer, scheduleControlsAutoHide]);

  // ─── Video event handlers ─────────────────────────────────────────────────

  const handleLoad = React.useCallback(
    (data: OnLoadData) => {
      const nextDuration = Number.isFinite(data.duration) ? data.duration : 0;

      durationRef.current = nextDuration;
      setDuration(nextDuration);
      hasLoadedRef.current = true;
      setBuffered(undefined);

      emit({ type: 'ready', duration: nextDuration });

      if (autoPlay) {
        setIsPlaying(true);
        emit({ type: 'play', reason: 'auto' });
      }
    },
    [autoPlay, emit],
  );

  const handleProgress = React.useCallback(
    (data: OnProgressData) => {
      const nextPosition = Number.isFinite(data.currentTime) ? data.currentTime : 0;
      const nextBuffered =
        typeof data.playableDuration === 'number' && Number.isFinite(data.playableDuration)
          ? data.playableDuration
          : undefined;

      positionRef.current = nextPosition;
      if (!isScrubbingRef.current) {
        setPosition(nextPosition);
      }
      setBuffered(nextBuffered);

      emit({ type: 'time_update', position: nextPosition });
    },
    [emit],
  );

  const handleEnd = React.useCallback(() => {
    setIsPlaying(false);
    setPausedOverride(true);
    showControls();
    clearAutoHideTimer();
    emit({ type: 'ended' });
  }, [clearAutoHideTimer, emit, showControls]);

  const handleError = React.useCallback(
    (error: OnVideoErrorData) => {
      let message = 'Video playback error';

      if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        const maybeError = error as { error?: { errorString?: string } };
        if (maybeError.error?.errorString) {
          message = maybeError.error.errorString;
        }
      }

      emit({ type: 'error', error: { message } });
    },
    [emit],
  );

  const handleSeek = React.useCallback(
    (data: OnSeekData) => {
      const nextPosition = Number.isFinite(data.currentTime) ? data.currentTime : data.seekTime;

      positionRef.current = nextPosition;
      setPosition(nextPosition);

      emit({ type: 'seek', reason: 'user', position: nextPosition });
    },
    [emit],
  );

  const handleBuffer = React.useCallback(
    (data: OnBufferData) => {
      const buffering = Boolean(data.isBuffering);

      if (buffering === isBufferingRef.current) {
        return;
      }

      isBufferingRef.current = buffering;
      setIsBuffering(buffering);

      emit({ type: buffering ? 'buffer_start' : 'buffer_end' });
    },
    [emit],
  );

  // ─── Scrub handlers ───────────────────────────────────────────────────────

  const handleScrubStart = React.useCallback(() => {
    isScrubbingRef.current = true;
    wasPlayingBeforeScrubRef.current = !resolvedPausedRef.current;
    if (!resolvedPausedRef.current) {
      setPausedOverride(true);
    }
    showControls();
    clearAutoHideTimer();
    onScrubStartProp?.();
  }, [clearAutoHideTimer, onScrubStartProp, showControls]);

  const handleScrubSeek = React.useCallback(
    (nextTime: number) => {
      positionRef.current = nextTime;
      onScrubMoveProp?.(nextTime);
    },
    [onScrubMoveProp],
  );

  const handleScrubEnd = React.useCallback(
    (nextTime: number) => {
      isScrubbingRef.current = false;
      positionRef.current = nextTime;
      setPosition(nextTime);
      videoRef.current?.seek(nextTime);

      if (wasPlayingBeforeScrubRef.current) {
        wasPlayingBeforeScrubRef.current = false;
        setPausedOverride(null);
      }

      onScrubEndProp?.(nextTime);
      scheduleControlsAutoHide();
    },
    [onScrubEndProp, scheduleControlsAutoHide, videoRef],
  );

  // ─── Surface press handler ────────────────────────────────────────────────

  const handleSurfacePress = React.useCallback(() => {
    toggleControls();
  }, [toggleControls]);

  // ─── Player actions ───────────────────────────────────────────────────────

  const play = React.useCallback(() => {
    setIsPlaying(true);
    if (paused !== undefined) {
      setPausedOverride(false);
    }
    emit({ type: 'play', reason: 'programmatic' });
    showControls();
    scheduleControlsAutoHide();
  }, [emit, paused, scheduleControlsAutoHide, showControls]);

  const pause = React.useCallback(() => {
    setIsPlaying(false);
    if (paused !== undefined) {
      setPausedOverride(true);
    }
    emit({ type: 'pause', reason: 'programmatic' });
    clearAutoHideTimer();
    showControls();
  }, [clearAutoHideTimer, emit, paused, showControls]);

  const togglePlayPause = React.useCallback(() => {
    const nextPaused = !resolvedPausedRef.current;
    setIsPlaying(!nextPaused);

    if (paused !== undefined) {
      setPausedOverride(nextPaused);
    }

    emit({ type: nextPaused ? 'pause' : 'play', reason: 'user' });
    showControls();
    scheduleControlsAutoHide();
  }, [emit, paused, scheduleControlsAutoHide, showControls]);

  const seekTo = React.useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(durationRef.current > 0 ? durationRef.current : time, time));
      positionRef.current = clamped;
      setPosition(clamped);
      videoRef.current?.seek(clamped);
      emit({ type: 'seek', reason: 'programmatic', position: clamped });
      showControls();
      scheduleControlsAutoHide();
    },
    [emit, scheduleControlsAutoHide, showControls, videoRef],
  );

  const seekForward = React.useCallback(
    (seconds = 10) => {
      const maxDuration = durationRef.current > 0 ? durationRef.current : Number.MAX_SAFE_INTEGER;
      const nextPosition = Math.min(maxDuration, positionRef.current + seconds);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
      videoRef.current?.seek(nextPosition);
      emit({ type: 'seek', reason: 'user', position: nextPosition });
      showControls();
      scheduleControlsAutoHide();
    },
    [emit, scheduleControlsAutoHide, showControls, videoRef],
  );

  const seekBackward = React.useCallback(
    (seconds = 10) => {
      const nextPosition = Math.max(0, positionRef.current - seconds);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
      videoRef.current?.seek(nextPosition);
      emit({ type: 'seek', reason: 'user', position: nextPosition });
      showControls();
      scheduleControlsAutoHide();
    },
    [emit, scheduleControlsAutoHide, showControls, videoRef],
  );

  const toggleMute = React.useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setPlaybackRate = React.useCallback((rate: number) => {
    setPlaybackRateState(rate);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      onFullscreenChange?.(next);
      return next;
    });
    setIsSettingsOpen(false);
    showControls();
    scheduleControlsAutoHide();
  }, [onFullscreenChange, scheduleControlsAutoHide, showControls]);

  const openSettings = React.useCallback(() => {
    if (!hasVisibleSettingsSections) {
      return;
    }
    setIsSettingsOpen(true);
    showControls();
  }, [hasVisibleSettingsSections, showControls]);

  const closeSettings = React.useCallback(() => {
    setIsSettingsOpen(false);
    scheduleControlsAutoHide();
  }, [scheduleControlsAutoHide]);

  // ─── Controller object ────────────────────────────────────────────────────

  return {
    // State
    isPlaying,
    isBuffering,
    isMuted,
    isFullscreen,
    playbackRate,
    position,
    duration,
    buffered,
    controlsVisible,
    isSettingsOpen,
    resolvedPaused,
    controlsOpacityAnim: controlsOpacityAnim.current,

    // Actions
    play,
    pause,
    togglePlayPause,
    seekTo,
    seekForward,
    seekBackward,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    showControls,
    hideControls,
    toggleControls,
    scheduleAutoHide: scheduleControlsAutoHide,
    openSettings,
    closeSettings,

    // Video event handlers
    handleLoad,
    handleProgress,
    handleEnd,
    handleError,
    handleSeek,
    handleBuffer,

    // Scrub / surface handlers
    handleScrubStart,
    handleScrubSeek,
    handleScrubEnd,
    handleSurfacePress,
  };
}
