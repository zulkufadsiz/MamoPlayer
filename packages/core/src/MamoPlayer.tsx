import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Video, {
  type OnBufferData,
  type OnLoadData,
  type OnProgressData,
  type OnSeekData,
  type OnVideoErrorData,
  type ReactVideoProps,
  type VideoRef,
} from 'react-native-video';
import {
  PlaybackOptions,
} from './components/PlaybackOptions';
import { SettingsOverlay } from './components/SettingsOverlay';
import { Timeline } from './components/Timeline';
import { type PlaybackEvent } from './types/playback';
import { type SettingsOverlayConfig } from './types/settings';

const CONTROLS_AUTO_HIDE_DELAY_MS = 3000;

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export type MamoPlayerSource = NonNullable<ReactVideoProps['source']>;

export interface MamoPlayerCoreProps extends Omit<
  ReactVideoProps,
  'source' | 'paused' | 'controls' | 'onLoad' | 'onProgress' | 'onEnd' | 'onError' | 'onSeek' | 'onBuffer'
> {
  source: MamoPlayerSource;
  autoPlay?: boolean;
  paused?: boolean;
  settingsOverlay?: SettingsOverlayConfig;
  topRightActions?: React.ReactNode;
  overlayContent?: React.ReactNode;
  onPlaybackEvent?: (event: PlaybackEvent) => void;
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
      onPlaybackEvent,
      style,
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
    const [, setIsBuffering] = React.useState<boolean>(false);
    const durationRef = React.useRef(0);
    const positionRef = React.useRef(0);
    const isScrubbingRef = React.useRef(false);
    const isBufferingRef = React.useRef(false);
    const videoRef = React.useRef<VideoRef | null>(null);
    const autoHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
        emit({ type: buffering ? 'buffer_start' : 'buffer_end' });
      },
      [emit],
    );

    const resolvedPaused = pausedOverride ?? paused ?? !isPlaying;
    const hasVisibleSettingsSections =
      resolvedSettings.showPlaybackSpeed ||
      resolvedSettings.showMute ||
      Boolean(resolvedSettings.extraItems) ||
      Boolean(resolvedSettings.extraMenuItems?.length);

    React.useEffect(() => {
      setPausedOverride(null);
    }, [paused]);

    const clearAutoHideTimer = React.useCallback(() => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    }, []);

    const scheduleControlsAutoHide = React.useCallback(() => {
      clearAutoHideTimer();

      if (resolvedPaused || isSettingsOpen || isScrubbingRef.current || !controlsVisible) {
        return;
      }

      autoHideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_AUTO_HIDE_DELAY_MS);
    }, [clearAutoHideTimer, controlsVisible, isSettingsOpen, resolvedPaused]);

    const showControls = React.useCallback(() => {
      setControlsVisible(true);
    }, []);

    React.useEffect(() => {
      if (resolvedPaused || isSettingsOpen) {
        setControlsVisible(true);
      }
    }, [isSettingsOpen, resolvedPaused]);

    React.useEffect(() => {
      scheduleControlsAutoHide();
      return clearAutoHideTimer;
    }, [clearAutoHideTimer, scheduleControlsAutoHide]);

    const handleScrubStart = React.useCallback(() => {
      isScrubbingRef.current = true;
      showControls();
      clearAutoHideTimer();
    }, []);

    const handleScrubSeek = React.useCallback((nextTime: number) => {
      positionRef.current = nextTime;
      setPosition(nextTime);
      showControls();
      clearAutoHideTimer();
    }, [clearAutoHideTimer, showControls]);

    const handleScrubEnd = React.useCallback((nextTime: number) => {
      isScrubbingRef.current = false;
      positionRef.current = nextTime;
      setPosition(nextTime);
      videoRef.current?.seek(nextTime);
      scheduleControlsAutoHide();
    }, [scheduleControlsAutoHide]);

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
      setIsFullscreen(prev => !prev);
      setIsSettingsOpen(false);
      showControls();
      scheduleControlsAutoHide();
    }, [scheduleControlsAutoHide, showControls]);

    const renderPlayer = () => (
      <>
        <Video
          ref={videoRef}
          {...rest}
          source={source as ReactVideoProps['source']}
          style={styles.video}
          controls={false}
          paused={resolvedPaused}
          rate={playbackRate}
          muted={muted}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onSeek={handleSeek}
          onBuffer={handleBuffer}
        />
        {overlayContent}
        {!controlsVisible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show playback controls"
            onPress={handleSurfacePress}
            style={styles.surfaceTouchArea}
            testID="core-player-surface"
          />
        ) : null}
        {controlsVisible && !isSettingsOpen ? (
          <View style={[styles.controlsOverlay, isFullscreen && styles.controlsOverlayFullscreen]} testID="core-controls-overlay">
            <View style={[styles.topRightControls, isFullscreen && styles.topRightControlsFullscreen]}>
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
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
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
