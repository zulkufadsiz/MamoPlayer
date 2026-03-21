import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video, {
  DRMType,
  type OnLoadData,
  type ReactVideoProps,
  type VideoRef,
} from 'react-native-video';
import { useCasting } from './casting/useCasting';
import { BufferingIndicator } from './components/BufferingIndicator';
import { DebugOverlay } from './components/DebugOverlay';
import { DoubleTapSeekOverlay } from './components/DoubleTapSeekOverlay';
import {
  PlaybackOptions,
} from './components/PlaybackOptions';
import { SettingsOverlay } from './components/SettingsOverlay';
import { Timeline } from './components/Timeline';
import { useCorePlayerController } from './hooks/useCorePlayerController';
import { useCoreSettingsSections } from './hooks/useCoreSettingsSections';
import { type CastingConfig } from './types/casting';
import { type DrmConfig } from './types/drm';
import { type PlaybackEvent } from './types/playback';
import { type SettingsOverlayConfig } from './types/settings';
import { detectSourceType } from './utils/source';

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
  /** Current quality label forwarded from the host. */
  quality?: string;
  /** Current audio track label forwarded from the host. */
  audioTrack?: string;
  /** Current subtitle track label forwarded from the host. */
  subtitleTrack?: string;
}

export interface MamoPlayerCoreProps extends Omit<
  ReactVideoProps,
  'source' | 'paused' | 'controls' | 'onLoad' | 'onProgress' | 'onEnd' | 'onError' | 'onSeek' | 'onBuffer' | 'drm' | 'debug'
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
   * Timeline.  When provided, the player shows a thumbnail frame preview while
   * the user is dragging the scrubber.
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
      casting,
      onScrubStart: onScrubStartProp,
      onScrubMove: onScrubMoveProp,
      onScrubEnd: onScrubEndProp,
      ...rest
    },
    ref,
  ) => {
    // ─── Debug-only state (not managed by controller) ─────────────────────
    const [hasEnded, setHasEnded] = React.useState<boolean>(false);
    const [rebufferCount, setRebufferCount] = React.useState<number>(0);
    const [lastError, setLastError] = React.useState<string | undefined>(undefined);
    const [debugPanelVisible, setDebugPanelVisible] = React.useState(false);
    const debugTapTimesRef = React.useRef<number[]>([]);

    const doubleTapSeekEnabled = gestures?.doubleTapSeek !== false;

    const handleDebugGesture = React.useCallback(() => {
      const now = Date.now();
      const recent = debugTapTimesRef.current.filter((t) => now - t < 700);
      recent.push(now);
      debugTapTimesRef.current = recent;

      if (recent.length >= 3) {
        debugTapTimesRef.current = [];
        setDebugPanelVisible((prev) => !prev);
      }
    }, []);

    const onStartShouldSetResponderCapture = React.useCallback(
      (evt: GestureResponderEvent) => evt.nativeEvent.touches.length >= 2,
      [],
    );

    const onResponderGrant = React.useCallback(
      (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length >= 2) {
          handleDebugGesture();
        }
      },
      [handleDebugGesture],
    );

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

    const videoRef = React.useRef<VideoRef>(null);

    const resolvedSettings = {
      enabled: settingsOverlay?.enabled ?? true,
      showPlaybackSpeed: settingsOverlay?.showPlaybackSpeed ?? true,
      showMute: settingsOverlay?.showMute ?? true,
      extraItems: settingsOverlay?.extraItems,
      extraMenuItems: settingsOverlay?.extraMenuItems,
      extraSections: settingsOverlay?.extraSections,
    };

    const hasVisibleSettingsSections =
      resolvedSettings.showPlaybackSpeed ||
      resolvedSettings.showMute ||
      Boolean(resolvedSettings.extraMenuItems?.length) ||
      Boolean(resolvedSettings.extraSections?.length) ||
      Boolean(resolvedSettings.extraItems);

    // ─── Controller ───────────────────────────────────────────────────────
    const controller = useCorePlayerController({
      videoRef,
      controls,
      autoPlay,
      paused,
      hasVisibleSettingsSections,
      onPlaybackEvent,
      onFullscreenChange,
      onScrubStart: onScrubStartProp,
      onScrubMove: onScrubMoveProp,
      onScrubEnd: onScrubEndProp,
    });

    // ─── Settings sections ────────────────────────────────────────────────
    const settingsSections = useCoreSettingsSections({
      playbackRate: controller.playbackRate,
      isMuted: controller.isMuted,
      setPlaybackRate: controller.setPlaybackRate,
      toggleMute: controller.toggleMute,
      showPlaybackSpeed: resolvedSettings.showPlaybackSpeed,
      showMute: resolvedSettings.showMute,
      extraMenuItems: resolvedSettings.extraMenuItems,
      extraSections: resolvedSettings.extraSections,
    });

    const {
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
      controlsOpacityAnim,
      togglePlayPause,
      seekForward,
      seekBackward,
      toggleMute,
      setPlaybackRate,
      toggleFullscreen,
      openSettings,
      closeSettings,
      handleSurfacePress,
      handleLoad: controllerHandleLoad,
      handleProgress,
      handleEnd: controllerHandleEnd,
      handleError: controllerHandleError,
      handleSeek,
      handleBuffer: controllerHandleBuffer,
      handleScrubStart,
      handleScrubSeek,
      handleScrubEnd,
    } = controller;

    // ─── Web hover — show controls on mouse-enter, schedule hide on leave ─
    // React Native Web passes these through to the DOM element. On native they
    // are never applied (Platform.OS !== 'web' guard).
    const webHoverProps = Platform.OS === 'web'
      ? { onMouseEnter: showControls, onMouseLeave: scheduleAutoHide }
      : {};

    // ─── Casting ──────────────────────────────────────────────────────────
    const castingEnabled = casting?.enabled === true;
    const { castState, showPicker: showCastPicker } = useCasting();

    // ─── Extra handlers that augment the controller ───────────────────────
    // These track debug-only state on top of the controller's own bookkeeping.

    const handleLoad = React.useCallback(
      (data: OnLoadData) => {
        setHasEnded(false);
        setRebufferCount(0);
        setLastError(undefined);
        controllerHandleLoad(data);
        onPlaybackEvent?.({
          type: 'source_type',
          sourceType,
          timestamp: Date.now(),
          duration: Number.isFinite(data.duration) ? data.duration : 0,
          position: 0,
        });
      },
      [controllerHandleLoad, onPlaybackEvent, sourceType],
    );

    const handleEnd = React.useCallback(() => {
      setHasEnded(true);
      controllerHandleEnd();
    }, [controllerHandleEnd]);

    const handleError = React.useCallback(
      (error: Parameters<typeof controllerHandleError>[0]) => {
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
        controllerHandleError(error);
      },
      [controllerHandleError],
    );

    const handleBuffer = React.useCallback(
      (data: Parameters<typeof controllerHandleBuffer>[0]) => {
        if (data.isBuffering) {
          setRebufferCount((prev) => prev + 1);
        }
        controllerHandleBuffer(data);
      },
      [controllerHandleBuffer],
    );

    React.useImperativeHandle(ref, () => videoRef.current as VideoRef);

    const playbackState =
      hasEnded ? 'ended'
      : isBuffering ? 'buffering'
      : resolvedPaused ? 'paused'
      : isPlaying ? 'playing'
      : 'idle';

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
          muted={isMuted}
          allowsExternalPlayback={castingEnabled}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onSeek={handleSeek}
          onBuffer={handleBuffer}
        />
        {overlayContent}
        {doubleTapSeekEnabled ? (
          <DoubleTapSeekOverlay
            onSeekBackward={seekBackward}
            onSeekForward={seekForward}
            onSingleTap={handleSurfacePress}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={controlsVisible ? 'Hide playback controls' : 'Show playback controls'}
            onPress={handleSurfacePress}
            style={styles.surfaceTouchArea}
            testID="core-player-surface"
          />
        )}
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
            }}
          />
        ) : null}
        {!isSettingsOpen ? (
          <Animated.View
            style={[styles.controlsOverlay, isFullscreen && styles.controlsOverlayFullscreen, { opacity: controlsOpacityAnim }]}
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
                onSeekBack={seekBackward}
                onTogglePlayPause={togglePlayPause}
                onSeekForward={seekForward}
                onToggleFullscreen={toggleFullscreen}
                onToggleSettingsMenu={openSettings}
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
                onSeekBack={seekBackward}
                onTogglePlayPause={togglePlayPause}
                onSeekForward={seekForward}
                onToggleFullscreen={toggleFullscreen}
                onToggleSettingsMenu={openSettings}
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
                onScrubMove={handleScrubSeek}
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
        {isSettingsOpen && resolvedSettings.enabled ? (
          <SettingsOverlay
            sections={settingsSections}
            isFullscreen={isFullscreen}
            onClose={closeSettings}
            extraContent={resolvedSettings.extraItems}
          />
        ) : null}
        <BufferingIndicator buffering={isBuffering} />
      </>
    );

    return (
      <>
        {!isFullscreen ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <View
            style={[styles.container, style]}
            {...(webHoverProps as any)}
            onStartShouldSetResponderCapture={debug?.enabled ? onStartShouldSetResponderCapture : undefined}
            onResponderGrant={debug?.enabled ? onResponderGrant : undefined}
          >
            {renderPlayer()}
          </View>
        ) : null}
        <Modal
          visible={isFullscreen}
          animationType="fade"
          transparent={false}
          onRequestClose={toggleFullscreen}
          statusBarTranslucent
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <View
            style={styles.fullscreenContainer}
            {...(webHoverProps as any)}
            onStartShouldSetResponderCapture={debug?.enabled ? onStartShouldSetResponderCapture : undefined}
            onResponderGrant={debug?.enabled ? onResponderGrant : undefined}
          >
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
