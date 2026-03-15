import React from 'react';
import {
    Image,
    LayoutChangeEvent,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const TOUCH_TARGET_HEIGHT = 40;
const TRACK_HEIGHT = 6;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_SIZE = 14;
const THUMB_RADIUS = THUMB_SIZE / 2;
const TRACK_COLOR = '#1F1F1F';
const BUFFERED_COLOR = '#6B7280';
const PLAYED_COLOR = '#E50914';
const THUMB_COLOR = '#F5F5F5';
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 68; // 16:9 aspect at this width
const SCRUB_PREVIEW_BOTTOM_OFFSET = TOUCH_TARGET_HEIGHT + 4;

const formatScrubTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export interface TimelineProps {
  /** Total duration of the video in seconds. */
  duration: number;
  /** Current playback position in seconds. */
  position: number;
  /** Amount of video buffered ahead of the current position, in seconds. */
  buffered?: number;
  /** Called when the user taps or lifts their finger at a new position. Receives the target time in seconds. */
  onSeek?: (time: number) => void;
  /** Called once when a scrub gesture begins (before any position change). */
  onScrubStart?: () => void;
  /** Called when the scrub gesture ends with the final seek target in seconds. */
  onScrubEnd?: (time: number) => void;
  /** URI of the thumbnail image to show while scrubbing. When provided a preview
   *  card (thumbnail + time label) floats above the thumb. */
  thumbnailUri?: string;
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
  thumbnailUri,
}) => {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  // scrubTime tracks the user's drag position in seconds (same unit as `position`).
  const [scrubTime, setScrubTime] = React.useState(0);

  // ── Stable refs so the PanResponder is created exactly once ──────────────
  // Assigning directly in the render body (not in an effect) ensures the ref
  // is always current before any synchronous event handler fires.
  const onSeekRef = React.useRef(onSeek);
  const onScrubStartRef = React.useRef(onScrubStart);
  const onScrubEndRef = React.useRef(onScrubEnd);
  const trackWidthRef = React.useRef(trackWidth);
  const safeDurationRef = React.useRef(duration > 0 ? duration : 0);
  // Lets onPanResponderTerminate read the latest scrub time without a stale closure.
  const scrubTimeRef = React.useRef(0);

  onSeekRef.current = onSeek;
  onScrubStartRef.current = onScrubStart;
  onScrubEndRef.current = onScrubEnd;
  safeDurationRef.current = duration > 0 ? duration : 0;
  // trackWidthRef is also updated synchronously inside handleLayout.

  const safeDuration = safeDurationRef.current;
  const playedRatio = safeDuration > 0 ? clamp(position / safeDuration, 0, 1) : 0;
  const bufferedRatio =
    safeDuration > 0 && typeof buffered === 'number' ? clamp(buffered / safeDuration, 0, 1) : 0;

  // While scrubbing, freeze the visual indicator to the local scrub position
  // so that incoming `position` prop updates (normal playback progress) do not
  // move the thumb or played-fill.
  const scrubRatio = safeDuration > 0 ? clamp(scrubTime / safeDuration, 0, 1) : 0;
  const visibleRatio = isScrubbing ? scrubRatio : playedRatio;

  // ── PanResponder ─────────────────────────────────────────────────────────
  // Created exactly ONCE (empty dep array). All volatile values are read
  // through refs so the gesture handler is never torn down mid-drag.
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: event => {
          const locationX = event.nativeEvent.locationX;
          const w = trackWidthRef.current;
          const d = safeDurationRef.current;
          const ratio = w > 0 ? clamp(locationX / w, 0, 1) : 0;
          const time = ratio * d;

          scrubTimeRef.current = time;
          setIsScrubbing(true);
          setScrubTime(time);
          onScrubStartRef.current?.();
          // Seek immediately to the tapped position so the player responds
          // to a simple tap (no drag) as well as the start of a drag.
          onSeekRef.current?.(time);
        },

        onPanResponderMove: event => {
          const locationX = event.nativeEvent.locationX;
          const w = trackWidthRef.current;
          const d = safeDurationRef.current;
          const ratio = w > 0 ? clamp(locationX / w, 0, 1) : 0;
          const time = ratio * d;

          scrubTimeRef.current = time;
          // Update local position only – do NOT call onSeek during the drag.
          // Continuous seeks cause playback interruptions and conflict with
          // the locally-frozen scrub state set above.
          setScrubTime(time);
        },

        onPanResponderRelease: event => {
          const locationX = event.nativeEvent.locationX;
          const w = trackWidthRef.current;
          const d = safeDurationRef.current;
          const ratio = w > 0 ? clamp(locationX / w, 0, 1) : 0;
          const finalTime = ratio * d;

          scrubTimeRef.current = finalTime;
          setScrubTime(finalTime);
          setIsScrubbing(false);
          // Commit the final scrub position to the player.
          onSeekRef.current?.(finalTime);
          onScrubEndRef.current?.(finalTime);
        },

        onPanResponderTerminate: () => {
          // Gesture stolen by OS / parent (e.g. a ScrollView). Commit whatever
          // position was last tracked so the seek is not silently dropped.
          const finalTime = scrubTimeRef.current;
          setIsScrubbing(false);
          onScrubEndRef.current?.(finalTime);
        },
      }),
    [], // Empty deps – reads live values via refs.
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  }, []);

  // ── Scrub-preview position ────────────────────────────────────────────────
  // Clamp the floating card so it never overflows the track edges.
  // The stylesheet's translateX(-THUMBNAIL_WIDTH/2) centres the 120 px-wide
  // card on the thumb, so `left` here is the thumb's centre in pixels.
  const halfPreview = THUMBNAIL_WIDTH / 2;
  const clampedPreviewX =
    trackWidth > 0
      ? clamp(visibleRatio * trackWidth, halfPreview, trackWidth - halfPreview)
      : visibleRatio * trackWidth;

  return (
    <View style={styles.container}>
      {isScrubbing ? (
        <View
          pointerEvents="none"
          style={[styles.scrubPreview, { left: clampedPreviewX }]}
          testID="timeline-scrub-preview"
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.scrubThumbnail}
              resizeMode="cover"
              testID="timeline-scrub-thumbnail"
            />
          ) : null}
          <Text style={styles.scrubTimeLabel} testID="timeline-scrub-time">
            {formatScrubTime(scrubTime)}
          </Text>
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  touchArea: {
    width: '100%',
    minHeight: TOUCH_TARGET_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    backgroundColor: TRACK_COLOR,
    overflow: 'hidden',
  },
  buffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BUFFERED_COLOR,
    borderRadius: TRACK_RADIUS,
  },
  played: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: PLAYED_COLOR,
    borderRadius: TRACK_RADIUS,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_RADIUS,
    backgroundColor: THUMB_COLOR,
    top: '50%',
    marginTop: -THUMB_SIZE / 2,
  },
  scrubPreview: {
    position: 'absolute',
    bottom: SCRUB_PREVIEW_BOTTOM_OFFSET,
    width: THUMBNAIL_WIDTH,
    transform: [{ translateX: -(THUMBNAIL_WIDTH / 2) }],
    alignItems: 'center',
    gap: 4,
  },
  scrubThumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 4,
    backgroundColor: '#111111',
  },
  scrubTimeLabel: {
    color: '#F5F5F5',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
