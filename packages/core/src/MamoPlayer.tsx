import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Video, {
    DRMType,
    type OnBufferData,
    type OnLoadData,
    type OnProgressData,
    type OnSeekData,
    type OnVideoErrorData,
    type ReactVideoProps,
    type VideoRef,
} from 'react-native-video';
import { BufferingIndicator } from './components/BufferingIndicator';
import { DebugOverlay } from './components/DebugOverlay';
import { DoubleTapSeekOverlay } from './components/DoubleTapSeekOverlay';
import {
    PlaybackOptions,
} from './components/PlaybackOptions';
import { SettingsOverlay } from './components/SettingsOverlay';
import { Timeline } from './components/Timeline';
import { type CastingConfig } from './types/casting';
import { type DrmConfig } from './types/drm';
import { type PlaybackEvent } from './types/playback';
import { type SettingsOverlayConfig } from './types/settings';
import { detectSourceType } from './utils/source';

const DEFAULT_AUTO_HIDE_DELAY_MS = 3000;

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/** Small banner shown in the top controls bar when a cast session is active. */
const CastingStatusBanner: React.FC<{ castState: 'connected' | 'connecting' }> = ({ castState }) => {
  const label = castState === 'connected' ? 'Casting to TV' : 'Connecting…';
  const iconName = castState === 'connected' ? 'cast-connected' : 'cast';
  const color = castState === 'connected' ? '#5BB5FF' : '#FFC840';
  return (
    <View style={castingBannerStyles.row} accessibilityLiveRegion="polite">
      <MaterialIcons name={iconName} color={color} size={14} />
      <Text style={[castingBannerStyles.text, { color }]}>{label}</Text>
    </View>
  );
};

const castingBannerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

/** Source type accepted by `MamoPlayer`. Supports all shapes accepted by `react-native-video`: a numeric `require()` asset, a URI string, a `{ uri }` object, or an array of source objects. */
export type MamoPlayerSource = NonNullable<ReactVideoProps['source']>;

/** Configuration for the controls bar auto-hide behaviour. */
export interface ControlsConfig {
  /** Automatically hide the controls overlay after a period of inactivity. Defaults to `true`. */
  autoHide?: boolean;
  /** Milliseconds of inactivity before the controls overlay fades out. Defaults to `3000`. */
  autoHideDelay?: number;
}

export interface GesturesConfig {
  /** Enable double-tap on left/right side of the player to seek ±10 seconds. Defaults to true. */
  doubleTapSeek?: boolean;
}

export interface DebugConfig {
  /** Show the developer debug overlay. Toggle visibility with a two-finger triple tap. */
  enabled?: boolean;
  /** Current quality label forwarded from the host (e.g. ProMamoPlayer). */
  quality?: string;
  /** Current audio track label forwarded from the host. */
  audioTrack?: string;
  /** Current subtitle track label forwarded from the host. */
  subtitleTrack?: string;
  /** Current ad state label forwarded from the host. */
  adState?: string;
}

export interface MamoPlayerCoreProps extends Omit<
  ReactVideoProps,
  'source' | 'paused' | 'controls' | 'onLoad' | 'onProgress' | 'onEnd' | 'onError' | 'onSeek' | 'onBuffer' | 'drm'
> {
  /** The video source. Accepts a `require()` asset, a URI string, a `{ uri }` object, or a source-array. */
  source: MamoPlayerSource;
  /** Start playback automatically when the player mounts. Defaults to `true`. */
  autoPlay?: boolean;
  /** Controlled paused state. When provided the player operates as a controlled component. */
  paused?: boolean;
  /** Configuration for the slide-up settings overlay. */
  settingsOverlay?: SettingsOverlayConfig;
  /** React node(s) rendered in the top-right corner of the controls overlay (e.g. a custom action button). */
  topRightActions?: React.ReactNode;
  /** React node(s) rendered on top of the video frame but below the controls overlay. */
  overlayContent?: React.ReactNode;
  /** Called whenever the player enters or exits fullscreen mode. */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Called for every playback lifecycle event (play, pause, seek, error, …). */
  onPlaybackEvent?: (event: PlaybackEvent) => void;
  /** Controls bar auto-hide configuration. */
  controls?: ControlsConfig;
  /** Touch-gesture configuration. */
  gestures?: GesturesConfig;
  /**
   * Optional thumbnail URI and other per-scrub configuration forwarded to the
   * Timeline.  Set by ProMamoPlayer to show a thumbnail frame preview while the
   * user is dragging the scrubber.
   */
  timelineConfig?: {
    thumbnailUri?: string;
  };
  /** Called once when a scrub gesture begins (before any position change). */
  onScrubStart?: () => void;
  /** Called on every scrub move with the candidate seek time in seconds. */
  onScrubMove?: (time: number) => void;
  /** Called when the scrub gesture ends with the final seek time in seconds. */
  onScrubEnd?: (time: number) => void;
  /**
   * Developer debug overlay configuration. When `enabled` is true a
   * semi-transparent panel with playback diagnostics is rendered on top of the
   * player; toggle it with a two-finger triple tap.
   */
  debug?: DebugConfig;
  /**
   * DRM configuration for protected streams. Supports Widevine (Android/DASH)
   * and FairPlay (iOS/HLS).
   */
  drm?: DrmConfig;
  /**
   * Casting configuration.  When `enabled` is true a cast button appears in
   * the top-right controls bar and the player enables AirPlay (iOS) /
   * Chromecast (Android) via the MamoCastModule native bridge.
   */
  casting?: CastingConfig;
}

export const MamoPlayerCore = React.forwardRef<VideoRef, MamoPlayerCoreProps>(
  (
    {
      source,
      autoPlay = true,
      paused,
      settingsOverlay,
      topRightActions,
      overlayContent,
      onFullscreenChange,
      onPlaybackEvent,
      controls,
      gestures,
      style,
      timelineConfig,
      debug,
      drm,
      onScrubStart: onScrubStartProp,
      onScrubMove: onScrubMoveProp,
      onScrubEnd: onScrubEndProp,
      ...rest
    },
    ref,
  ) => {
    const [duration, setDuration] = React.useState<number>(0);
    const [position, setPosition] = React.useState<number>(0);
    const [buffered, setBuffered] = React.useState<number | undefined>(undefined);
    const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = React.useState<number>(1);
    const [muted, setMuted] = React.useState<boolean>(false);
    const [controlsVisible, setControlsVisible] = React.useState<boolean>(true);
    const [pausedOverride, setPausedOverride] = React.useState<boolean | null>(null);
    const [isBuffering, setIsBuffering] = React.useState<boolean>(false);
    const [hasEnded, setHasEnded] = React.useState<boolean>(false);
    const [rebufferCount, setRebufferCount] = React.useState<number>(0);
    const [lastError, setLastError] = React.useState<string | undefined>(undefined);
    const resolvedAutoHide = controls?.autoHide ?? true;
    const resolvedAutoHideDelay = controls?.autoHideDelay ?? DEFAULT_AUTO_HIDE_DELAY_MS;
    const doubleTapSeekEnabled = gestures?.doubleTapSeek !== false;

    const resolvedSource = React.useMemo(() => {
      if (!drm) return source;
      return {
        ...source,
        drm: {
          type: drm.type as DRMType,
          licenseServer: drm.licenseServer,
          ...(drm.headers ? { headers: drm.headers } : {}),
        },
      };
    }, [drm, source]);

    const sourceType = React.useMemo(() => detectSourceType(source), [source]);

    const durationRef = React.useRef(0);
    const positionRef = React.useRef(0);
    const isScrubbingRef = React.useRef(false);
    const wasPlayingBeforeScrubRef = React.useRef(false);
    const isBufferingRef = React.useRef(false);
    const hasLoadedRef = React.useRef(false);
    const videoRef = React.useRef<VideoRef | null>(null);
    const autoHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const controlsOpacityAnim = React.useRef(new Animated.Value(1));

    const resolvedSettings = {
      enabled: settingsOverlay?.enabled ?? true,
      showPlaybackSpeed: settingsOverlay?.showPlaybackSpeed ?? true,
      showMute: settingsOverlay?.showMute ?? true,
      extraItems: settingsOverlay?.extraItems,
      extraMenuItems: settingsOverlay?.extraMenuItems,
    };

    React.useImperativeHandle(ref, () => videoRef.current as VideoRef);

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

    const handleLoad = React.useCallback(
      (data: OnLoadData) => {
        const nextDuration = Number.isFinite(data.duration) ? data.duration : 0;

        durationRef.current = nextDuration;
        setDuration(nextDuration);
        hasLoadedRef.current = true;
        setHasEnded(false);
        setRebufferCount(0);
        setLastError(undefined);

        emit({ type: 'ready', duration: nextDuration });
        emit({ type: 'source_type', sourceType });

        if (autoPlay) {
          setIsPlaying(true);
          emit({ type: 'play', reason: 'auto' });
        }
      },
      [autoPlay, emit, sourceType],
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
      setHasEnded(true);
      setPausedOverride(true);
      emit({ type: 'ended' });
    }, [emit]);

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

        setLastError(message);
        emit({
          type: 'error',
          error: {
            message,
          },
        });
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
        if (buffering && hasLoadedRef.current) {
          setRebufferCount((prev) => prev + 1);
        }
        emit({ type: buffering ? 'buffer_start' : 'buffer_end' });
      },
      [emit],
    );

    const resolvedPaused = pausedOverride ?? paused ?? !isPlaying;
    // Ref kept in sync on every render so scrub callbacks can read the current
    // paused state without being added to useCallback dependency arrays.
    const resolvedPausedRef = React.useRef(resolvedPaused);
    resolvedPausedRef.current = resolvedPaused;
    const hasVisibleSettingsSections =
      resolvedSettings.showPlaybackSpeed ||
      resolvedSettings.showMute ||
      Boolean(resolvedSettings.extraItems) ||
      Boolean(resolvedSettings.extraMenuItems?.length);

    const playbackState =
      hasEnded ? 'ended'
      : isBuffering ? 'buffering'
      : resolvedPaused ? 'paused'
      : isPlaying ? 'playing'
      : 'idle';

    React.useEffect(() => {
      setPausedOverride(null);
    }, [paused]);

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

      if (!resolvedAutoHide || resolvedPaused || isSettingsOpen || isScrubbingRef.current || !controlsVisible) {
        return;
      }

      autoHideTimerRef.current = setTimeout(hideControls, resolvedAutoHideDelay);
    }, [clearAutoHideTimer, controlsVisible, hideControls, isSettingsOpen, resolvedAutoHide, resolvedAutoHideDelay, resolvedPaused]);

    React.useEffect(() => {
      if (resolvedPaused || isSettingsOpen) {
        showControls();
      }
    }, [isSettingsOpen, resolvedPaused, showControls]);

    React.useEffect(() => {
      scheduleControlsAutoHide();
      return clearAutoHideTimer;
    }, [clearAutoHideTimer, scheduleControlsAutoHide]);

    const handleScrubStart = React.useCallback(() => {
      isScrubbingRef.current = true;
      // Pause video so audio stops while the user is picking a new position.
      // Track whether we need to resume on scrub end.
      wasPlayingBeforeScrubRef.current = !resolvedPausedRef.current;
      if (!resolvedPausedRef.current) {
        setPausedOverride(true);
      }
      showControls();
      clearAutoHideTimer();
      onScrubStartProp?.();
    }, [clearAutoHideTimer, onScrubStartProp, showControls]);

    const handleScrubSeek = React.useCallback((nextTime: number) => {
      // Only update the ref — the scrub position is displayed inside Timeline's
      // own scrub bubble, so we avoid a full MamoPlayerCore re-render on every
      // pan-move event, which is the main cause of jank on low-end devices.
      positionRef.current = nextTime;
      onScrubMoveProp?.(nextTime);
    }, [onScrubMoveProp]);

    const handleScrubEnd = React.useCallback((nextTime: number) => {
      isScrubbingRef.current = false;
      positionRef.current = nextTime;
      // Update visible position immediately so the time row reflects the new
      // position before the first progress event fires after the seek.
      setPosition(nextTime);
      videoRef.current?.seek(nextTime);
      // Resume playback if the video was playing when the user started scrubbing.
      if (wasPlayingBeforeScrubRef.current) {
        wasPlayingBeforeScrubRef.current = false;
        setPausedOverride(null);
      }
      onScrubEndProp?.(nextTime);
      scheduleControlsAutoHide();
    }, [onScrubEndProp, scheduleControlsAutoHide]);

    const handleTogglePlayback = React.useCallback(() => {
      const nextPaused = !resolvedPaused;
      setIsPlaying(!nextPaused);

      if (paused !== undefined) {
        setPausedOverride(nextPaused);
      }

      emit({ type: nextPaused ? 'pause' : 'play', reason: 'user' });

      showControls();
      scheduleControlsAutoHide();
    }, [emit, paused, resolvedPaused, scheduleControlsAutoHide, showControls]);

    const handleSurfacePress = React.useCallback(() => {
      if (!controlsVisible) {
        showControls();
      }
      scheduleControlsAutoHide();
    }, [controlsVisible, scheduleControlsAutoHide, showControls]);

    const handleSeekBackward = React.useCallback(() => {
      const nextPosition = Math.max(0, positionRef.current - 10);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
      videoRef.current?.seek(nextPosition);
      emit({ type: 'seek', reason: 'user', position: nextPosition });
      showControls();
      scheduleControlsAutoHide();
    }, [emit, scheduleControlsAutoHide, showControls]);

    const handleSeekForward = React.useCallback(() => {
      const maxDuration = durationRef.current > 0 ? durationRef.current : Number.MAX_SAFE_INTEGER;
      const nextPosition = Math.min(maxDuration, positionRef.current + 10);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
      videoRef.current?.seek(nextPosition);
      emit({ type: 'seek', reason: 'user', position: nextPosition });
      showControls();
      scheduleControlsAutoHide();
    }, [emit, scheduleControlsAutoHide, showControls]);

    const handleToggleSettingsMenu = React.useCallback(() => {
      if (!resolvedSettings.enabled || !hasVisibleSettingsSections) {
        return;
      }

      setIsSettingsOpen(prev => !prev);
      showControls();
      scheduleControlsAutoHide();
    }, [hasVisibleSettingsSections, resolvedSettings.enabled, scheduleControlsAutoHide, showControls]);

    const handleToggleFullscreen = React.useCallback(() => {
      setIsFullscreen(prev => {
        const nextFullscreen = !prev;
        onFullscreenChange?.(nextFullscreen);
        return nextFullscreen;
      });
      setIsSettingsOpen(false);
      showControls();
      scheduleControlsAutoHide();
    }, [onFullscreenChange, scheduleControlsAutoHide, showControls]);

    const renderPlayer = () => (
      <>
        <Video
          ref={videoRef}
          useTextureView={Platform.OS === 'android'}
          {...rest}
          source={resolvedSource as ReactVideoProps['source']}
          style={styles.video}
          controls={false}
          paused={resolvedPaused}
          rate={playbackRate}
          muted={muted}
          allowsExternalPlayback={castingEnabled}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onSeek={handleSeek}
          onBuffer={handleBuffer}
        />
        {overlayContent}
        <BufferingIndicator buffering={isBuffering} />
        {doubleTapSeekEnabled ? (
          <DoubleTapSeekOverlay
            onSeekBackward={handleSeekBackward}
            onSeekForward={handleSeekForward}
            onSingleTap={handleSurfacePress}
          />
        ) : !controlsVisible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show playback controls"
            onPress={handleSurfacePress}
            style={styles.surfaceTouchArea}
            testID="core-player-surface"
          />
        ) : null}
        {!isSettingsOpen ? (
          <Animated.View
            style={[styles.controlsOverlay, isFullscreen && styles.controlsOverlayFullscreen, { opacity: controlsOpacityAnim.current }]}
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
            testID="core-controls-overlay"
          >
            <View style={[styles.topRightControls, isFullscreen && styles.topRightControlsFullscreen]}>
              {castingEnabled && (castState === 'connected' || castState === 'connecting') ? (
                <CastingStatusBanner castState={castState} />
              ) : null}
              {topRightActions ? <View style={styles.topRightActionsContainer}>{topRightActions}</View> : null}
              <PlaybackOptions
                isPlaying={!resolvedPaused}
                isFullscreen={isFullscreen}
                onSeekBack={handleSeekBackward}
                onTogglePlayPause={handleTogglePlayback}
                onSeekForward={handleSeekForward}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleSettingsMenu={handleToggleSettingsMenu}
                showFullscreenButton
                showSettingsMenuButton={resolvedSettings.enabled && hasVisibleSettingsSections}
                showTransportButtons={false}
                compact
                showCastButton={castingEnabled}
                castState={castState}
                onPressCast={showCastPicker}
              />
            </View>

            <View style={styles.centerControlsContainer}>
              <PlaybackOptions
                isPlaying={!resolvedPaused}
                isFullscreen={isFullscreen}
                onSeekBack={handleSeekBackward}
                onTogglePlayPause={handleTogglePlayback}
                onSeekForward={handleSeekForward}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleSettingsMenu={handleToggleSettingsMenu}
                showFullscreenButton={false}
                showSettingsMenuButton={false}
              />
            </View>

            <View style={styles.timelineContainer}>
              <Timeline
                duration={duration}
                position={position}
                buffered={buffered}
                onSeek={handleScrubSeek}
                onScrubStart={handleScrubStart}
                onScrubEnd={handleScrubEnd}
                thumbnailUri={timelineConfig?.thumbnailUri}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </Animated.View>
        ) : null}
        {isSettingsOpen && resolvedSettings.enabled && hasVisibleSettingsSections ? (
          <SettingsOverlay
            showPlaybackSpeed={resolvedSettings.showPlaybackSpeed}
            showMute={resolvedSettings.showMute}
            extraItems={resolvedSettings.extraItems}
            extraMenuItems={resolvedSettings.extraMenuItems}
            playbackRate={playbackRate}
            muted={muted}
            isFullscreen={isFullscreen}
            onSelectPlaybackRate={setPlaybackRate}
            onToggleMuted={() => setMuted(prev => !prev)}
            onClose={() => setIsSettingsOpen(false)}
          />
        ) : null}
        {debug?.enabled === true ? (
          <DebugOverlay
            info={{
              playbackState,
              position,
              duration,
              buffered,
              rebufferCount,
              lastError,
              quality: debug.quality,
              audioTrack: debug.audioTrack,
              subtitleTrack: debug.subtitleTrack,
              adState: debug.adState,
            }}
          />
        ) : null}
      </>
    );

    return (
      <>
        {!isFullscreen ? (
          <View style={[styles.container, style]}>
            {renderPlayer()}
          </View>
        ) : null}
        <Modal
          visible={isFullscreen}
          animationType="fade"
          transparent={false}
          onRequestClose={handleToggleFullscreen}
          statusBarTranslucent
        >
          <View style={styles.fullscreenContainer}>
            {renderPlayer()}
          </View>
        </Modal>
      </>
    );
  },
);

MamoPlayerCore.displayName = 'MamoPlayerCore';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    flex: 1,
  },
  surfaceTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'space-between',
  },
  controlsOverlayFullscreen: {
    paddingBottom: 26,
  },
  topRightControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightControlsFullscreen: {
    top: 40,
  },
  topRightActionsContainer: {
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerControlsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timelineContainer: {
    width: '100%',
  },
  timeRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default MamoPlayerCore;
