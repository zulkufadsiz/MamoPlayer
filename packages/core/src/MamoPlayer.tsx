import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  type PlaybackOption,
  type PlaybackOptionId,
} from './components/PlaybackOptions';
import { Timeline } from './components/Timeline';
import { type PlaybackEvent } from './types/playback';
import { type SettingsOverlayConfig } from './types/settings';

export type MamoPlayerSource = NonNullable<ReactVideoProps['source']>;

export interface MamoPlayerCoreProps extends Omit<
  ReactVideoProps,
  'source' | 'paused' | 'onLoad' | 'onProgress' | 'onEnd' | 'onError' | 'onSeek' | 'onBuffer'
> {
  source: MamoPlayerSource;
  autoPlay?: boolean;
  paused?: boolean;
  settingsOverlay?: SettingsOverlayConfig;
  onPlaybackEvent?: (event: PlaybackEvent) => void;
}

const coreOptions: PlaybackOption[] = [
  { id: 'seek-back', icon: <Text>⟲10</Text>, label: 'Back' },
  { id: 'seek-forward', icon: <Text>10⟳</Text>, label: 'Next' },
  { id: 'settings', icon: <Text>⚙</Text>, label: 'Settings' },
  { id: 'fullscreen', icon: <Text>⛶</Text>, label: 'Full' },
];

export const MamoPlayerCore = React.forwardRef<VideoRef, MamoPlayerCoreProps>(
  ({ source, autoPlay = true, paused, settingsOverlay, onPlaybackEvent, ...rest }, ref) => {
    const [duration, setDuration] = React.useState<number>(0);
    const [position, setPosition] = React.useState<number>(0);
    const [buffered, setBuffered] = React.useState<number | undefined>(undefined);
    const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
    const [showSettings, setShowSettings] = React.useState<boolean>(false);
    const [, setIsBuffering] = React.useState<boolean>(false);
    const durationRef = React.useRef(0);
    const positionRef = React.useRef(0);
    const isScrubbingRef = React.useRef(false);
    const isBufferingRef = React.useRef(false);
    const videoRef = React.useRef<VideoRef | null>(null);

    const resolvedSettings = {
      enabled: settingsOverlay?.enabled ?? true,
      showPlaybackSpeed: settingsOverlay?.showPlaybackSpeed ?? true,
      showMute: settingsOverlay?.showMute ?? true,
    };

    const controlOptions = resolvedSettings.enabled
      ? coreOptions
      : coreOptions.filter(option => option.id !== 'settings');

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

    const resolvedPaused = paused ?? !isPlaying;

    const handleScrubStart = React.useCallback(() => {
      isScrubbingRef.current = true;
    }, []);

    const handleScrubEnd = React.useCallback((nextTime: number) => {
      isScrubbingRef.current = false;
      positionRef.current = nextTime;
      setPosition(nextTime);
      videoRef.current?.seek(nextTime);
    }, []);

    const handlePressOption = React.useCallback(
      (id: PlaybackOptionId) => {
        switch (id) {
          case 'seek-back': {
            const nextPosition = Math.max(0, positionRef.current - 10);
            positionRef.current = nextPosition;
            setPosition(nextPosition);
            videoRef.current?.seek(nextPosition);
            emit({ type: 'seek', reason: 'user', position: nextPosition });
            break;
          }
          case 'seek-forward': {
            const maxDuration = durationRef.current > 0 ? durationRef.current : Number.MAX_SAFE_INTEGER;
            const nextPosition = Math.min(maxDuration, positionRef.current + 10);
            positionRef.current = nextPosition;
            setPosition(nextPosition);
            videoRef.current?.seek(nextPosition);
            emit({ type: 'seek', reason: 'user', position: nextPosition });
            break;
          }
          case 'settings':
            if (resolvedSettings.enabled) {
              setShowSettings(prev => !prev);
            }
            break;
          case 'fullscreen': {
            setIsFullscreen(prev => {
              const nextFullscreen = !prev;
              if (nextFullscreen) {
                videoRef.current?.presentFullscreenPlayer?.();
              } else {
                videoRef.current?.dismissFullscreenPlayer?.();
              }
              return nextFullscreen;
            });
            break;
          }
          default:
            break;
        }
      },
      [emit, resolvedSettings.enabled],
    );

    return (
      <View style={styles.container}>
        <Video
          ref={videoRef}
          {...rest}
          source={source as ReactVideoProps['source']}
          paused={resolvedPaused}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onSeek={handleSeek}
          onBuffer={handleBuffer}
        />
        <Timeline
          duration={duration}
          position={position}
          buffered={buffered}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
        <View style={styles.controlsContainer}>
          <PlaybackOptions options={controlOptions} onPressOption={handlePressOption} />
        </View>
        {showSettings && resolvedSettings.enabled ? (
          <View style={styles.settingsOverlay}>
            <Text style={styles.settingsText}>Settings</Text>
            {resolvedSettings.showPlaybackSpeed ? (
              <Text style={styles.settingsItemText}>Playback speed</Text>
            ) : null}
            {resolvedSettings.showMute ? <Text style={styles.settingsItemText}>Mute</Text> : null}
          </View>
        ) : null}
      </View>
    );
  },
);

MamoPlayerCore.displayName = 'MamoPlayerCore';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  controlsContainer: {
    marginTop: 8,
  },
  settingsOverlay: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    alignSelf: 'flex-start',
  },
  settingsText: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  settingsItemText: {
    marginTop: 6,
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default MamoPlayerCore;
