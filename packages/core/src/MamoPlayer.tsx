import React from 'react';
import Video, {
    type OnBufferData,
    type OnLoadData,
    type OnProgressData,
    type OnSeekData,
    type OnVideoErrorData,
    type ReactVideoProps,
    type VideoRef,
} from 'react-native-video';
import { type PlaybackEvent } from './types/playback';

export type MamoPlayerSource = { uri: string } | number;

export interface MamoPlayerCoreProps extends Omit<
  ReactVideoProps,
  'source' | 'paused' | 'onLoad' | 'onProgress' | 'onEnd' | 'onError' | 'onSeek' | 'onBuffer'
> {
  source: MamoPlayerSource;
  autoPlay?: boolean;
  paused?: boolean;
  onPlaybackEvent?: (event: PlaybackEvent) => void;
}

export const MamoPlayerCore = React.forwardRef<VideoRef, MamoPlayerCoreProps>(({
  source,
  autoPlay = true,
  paused,
  onPlaybackEvent,
  ...rest
}, ref) => {
  const [, setDuration] = React.useState<number>(0);
  const [, setPosition] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [, setIsBuffering] = React.useState<boolean>(false);
  const durationRef = React.useRef(0);
  const positionRef = React.useRef(0);
  const isBufferingRef = React.useRef(false);

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

      positionRef.current = nextPosition;
      setPosition(nextPosition);

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

  return (
    <Video
      ref={ref}
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
  );
});

MamoPlayerCore.displayName = 'MamoPlayerCore';

export default MamoPlayerCore;
