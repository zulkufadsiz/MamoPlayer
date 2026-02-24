import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ThumbnailFrame = {
  time: number;
  uri: string;
};

type ThumbnailsConfig = {
  frames: ThumbnailFrame[];
};

function getThumbnailForTime(
  config: ThumbnailsConfig | undefined,
  time: number,
): ThumbnailFrame | null {
  if (!config || !Array.isArray(config.frames) || config.frames.length === 0) {
    return null;
  }

  let closestFrame: ThumbnailFrame | null = null;

  for (const frame of config.frames) {
    if (frame.time > time) {
      continue;
    }

    if (!closestFrame || frame.time > closestFrame.time) {
      closestFrame = frame;
    }
  }

  return closestFrame;
}

interface TimelineProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onSeek: (time: number) => void;
  isFullscreen?: boolean;
  mediaUrl?: string | null;
  thumbnails?: ThumbnailsConfig;
}

export default function Timeline({
  isPlaying,
  player,
  duration,
  onSeek,
  isFullscreen = false,
  mediaUrl: _mediaUrl,
  thumbnails,
}: TimelineProps) {
  const insets = useSafeAreaInsets();
  const fullscreenHorizontalInset = Math.max(insets.left, insets.right);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  const getSafeCurrentTime = () => {
    try {
      return player?.currentTime ?? 0;
    } catch {
      return 0;
    }
  };

  const getSafeDuration = () => {
    try {
      return player?.duration ?? 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (isSeeking) return;
        const currentTime = getSafeCurrentTime();
        setSeekPosition(Number.isFinite(currentTime) ? currentTime : 0);
      },
      isPlaying ? 250 : 500,
    );

    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, player]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '00:00:00';
    }

    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSlidingStart = () => {
    setIsSeeking(true);
    setScrubTime(seekPosition);
  };

  const handleSlidingComplete = (value: number) => {
    setIsSeeking(false);
    setSeekPosition(value);
    setScrubTime(null);
    onSeek(value);
  };

  const handleValueChange = (value: number) => {
    setScrubTime(value);
  };

  const resolvedDuration = duration > 0 ? duration : getSafeDuration();
  const timelinePosition = isSeeking && scrubTime !== null ? scrubTime : seekPosition;
  const previewBubbleWidth = 132;
  const previewProgress = resolvedDuration > 0 ? timelinePosition / resolvedDuration : 0;
  const previewLeft = Math.max(
    0,
    Math.min(
      sliderWidth - previewBubbleWidth,
      previewProgress * sliderWidth - previewBubbleWidth / 2,
    ),
  );

  const shouldShowScrubOverlay = isSeeking && thumbnails !== undefined && scrubTime !== null;
  const activeThumbnail = shouldShowScrubOverlay
    ? getThumbnailForTime(thumbnails, scrubTime)
    : null;

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[
        styles.container,
        isFullscreen && {
          paddingLeft: Math.max(12, fullscreenHorizontalInset + 8),
          paddingRight: Math.max(12, fullscreenHorizontalInset + 8),
          paddingBottom: Math.max(8, insets.bottom + 4),
        },
      ]}
    >
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <Text
          style={styles.timeText}
          accessibilityLabel={`Current time ${formatTime(timelinePosition)}`}
        >
          {formatTime(timelinePosition)}
        </Text>
        <View style={styles.sliderWrapper} onLayout={handleSliderLayout}>
          {activeThumbnail && (
            <View style={[styles.previewBubble, { left: previewLeft }]} pointerEvents="none">
              <View style={styles.previewImageWrap}>
                <Image source={{ uri: activeThumbnail.uri }} style={styles.previewImage} />
              </View>
              <Text style={styles.previewTime}>{formatTime(scrubTime ?? 0)}</Text>
            </View>
          )}
          <Slider
            style={styles.slider}
            value={timelinePosition}
            minimumValue={0}
            maximumValue={resolvedDuration || 1}
            onSlidingStart={handleSlidingStart}
            onSlidingComplete={handleSlidingComplete}
            onValueChange={handleValueChange}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#404040"
            thumbTintColor="#FFFFFF"
            accessibilityRole="adjustable"
            accessibilityLabel="Playback position"
            accessibilityHint="Swipe up or down to adjust the current playback time"
          />
        </View>
        <Text
          style={styles.timeText}
          accessibilityLabel={`Duration ${formatTime(resolvedDuration)}`}
        >
          {formatTime(resolvedDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 8,
    position: 'relative',
  },
  previewBubble: {
    position: 'absolute',
    width: 132,
    bottom: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 5,
  },
  previewImageWrap: {
    width: '100%',
    height: 72,
    backgroundColor: '#121212',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewTime: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    minWidth: 65,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
