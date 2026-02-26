import React from 'react';
import {
    LayoutChangeEvent,
    PanResponder,
    StyleSheet,
    View,
} from 'react-native';

export interface TimelineProps {
  duration: number;
  position: number;
  buffered?: number;
  onSeek?: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: (time: number) => void;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  position,
  buffered,
  onSeek,
  onScrubStart,
  onScrubEnd,
}) => {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubRatio, setScrubRatio] = React.useState(0);

  const safeDuration = duration > 0 ? duration : 0;
  const playedRatio = safeDuration > 0 ? clamp(position / safeDuration, 0, 1) : 0;
  const bufferedRatio =
    safeDuration > 0 && typeof buffered === 'number' ? clamp(buffered / safeDuration, 0, 1) : 0;

  const visibleRatio = isScrubbing ? scrubRatio : playedRatio;

  const ratioToTime = React.useCallback(
    (ratio: number) => {
      if (safeDuration <= 0) {
        return 0;
      }

      return clamp(ratio, 0, 1) * safeDuration;
    },
    [safeDuration],
  );

  const locationToRatio = React.useCallback(
    (locationX: number) => {
      if (trackWidth <= 0) {
        return 0;
      }

      return clamp(locationX / trackWidth, 0, 1);
    },
    [trackWidth],
  );

  const updateScrub = React.useCallback(
    (locationX: number) => {
      const nextRatio = locationToRatio(locationX);
      const nextTime = ratioToTime(nextRatio);

      setScrubRatio(nextRatio);
      onSeek?.(nextTime);

      return nextTime;
    },
    [locationToRatio, onSeek, ratioToTime],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event => {
          const locationX = event.nativeEvent.locationX;

          setIsScrubbing(true);
          onScrubStart?.();
          updateScrub(typeof locationX === 'number' ? locationX : 0);
        },
        onPanResponderMove: event => {
          const locationX = event.nativeEvent.locationX;

          updateScrub(typeof locationX === 'number' ? locationX : 0);
        },
        onPanResponderRelease: event => {
          const locationX = event.nativeEvent.locationX;
          const finalTime = updateScrub(typeof locationX === 'number' ? locationX : 0);

          setIsScrubbing(false);
          onScrubEnd?.(finalTime);
        },
        onPanResponderTerminate: event => {
          const locationX = event.nativeEvent.locationX;
          const finalTime = updateScrub(typeof locationX === 'number' ? locationX : 0);

          setIsScrubbing(false);
          onScrubEnd?.(finalTime);
        },
      }),
    [onScrubEnd, onScrubStart, updateScrub],
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.touchArea} onLayout={handleLayout} {...panResponder.panHandlers}>
        <View style={styles.track}>
          {typeof buffered === 'number' ? (
            <View style={[styles.buffered, { width: `${bufferedRatio * 100}%` }]} />
          ) : null}
          <View style={[styles.played, { width: `${visibleRatio * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${visibleRatio * 100}%` }]} />
      </View>
    </View>
  );
};

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  touchArea: {
    width: '100%',
    minHeight: 36,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  buffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#5A5A5A',
    borderRadius: TRACK_HEIGHT / 2,
  },
  played: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E50914',
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    top: '50%',
    marginTop: -THUMB_SIZE / 2,
  },
});
