import Slider from '@react-native-community/slider';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TimelineProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onSeek: (time: number) => void;
  isFullscreen?: boolean;
  mediaUrl?: string | null;
}

export default function Timeline({
  isPlaying,
  player,
  duration,
  onSeek,
  isFullscreen = false,
  mediaUrl,
}: TimelineProps) {
  const insets = useSafeAreaInsets();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const thumbnailCacheRef = React.useRef<Record<number, string>>({});
  const previewTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRequestIdRef = React.useRef(0);

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
    const interval = setInterval(() => {
      if (isSeeking) return;
      const currentTime = getSafeCurrentTime();
      setSeekPosition(Number.isFinite(currentTime) ? currentTime : 0);
    }, isPlaying ? 250 : 500);

    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, player]);

  useEffect(() => {
    thumbnailCacheRef.current = {};
    setPreviewUri(null);
  }, [mediaUrl]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

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
    scheduleThumbnailLoad(seekPosition);
  };

  const handleSlidingComplete = (value: number) => {
    setIsSeeking(false);
    onSeek(value);
  };

  const handleValueChange = (value: number) => {
    setSeekPosition(value);
    scheduleThumbnailLoad(value);
  };

  const resolvedDuration = duration > 0 ? duration : getSafeDuration();
  const previewBubbleWidth = 132;
  const previewProgress = resolvedDuration > 0 ? seekPosition / resolvedDuration : 0;
  const previewLeft = Math.max(
    0,
    Math.min(
      sliderWidth - previewBubbleWidth,
      previewProgress * sliderWidth - previewBubbleWidth / 2
    )
  );

  const loadThumbnail = async (timeSeconds: number) => {
    if (!mediaUrl) {
      setPreviewUri(null);
      return;
    }

    const bucket = Math.max(0, Math.floor(timeSeconds));
    const cached = thumbnailCacheRef.current[bucket];
    if (cached) {
      setPreviewUri(cached);
      return;
    }

    const requestId = ++previewRequestIdRef.current;
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(mediaUrl, {
        time: bucket * 1000,
        quality: 0.5,
      });
      thumbnailCacheRef.current[bucket] = uri;
      if (requestId === previewRequestIdRef.current) {
        setPreviewUri(uri);
      }
    } catch {
      if (requestId === previewRequestIdRef.current) {
        setPreviewUri(null);
      }
    }
  };

  const scheduleThumbnailLoad = (timeSeconds: number) => {
    if (!mediaUrl) return;
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = setTimeout(() => {
      void loadThumbnail(timeSeconds);
    }, 80);
  };

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[
      styles.container,
      isFullscreen && {
        paddingLeft: Math.max(12, insets.left + 8),
        paddingRight: Math.max(12, insets.right + 8),
        paddingBottom: Math.max(8, insets.bottom + 4),
      }
    ]}>
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <Text
          style={styles.timeText}
          accessibilityLabel={`Current time ${formatTime(seekPosition)}`}
        >
          {formatTime(seekPosition)}
        </Text>
        <View style={styles.sliderWrapper} onLayout={handleSliderLayout}>
          {isSeeking && (
            <View style={[styles.previewBubble, { left: previewLeft }]} pointerEvents="none">
              <View style={styles.previewImageWrap}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewFallback}>
                    <Text style={styles.previewFallbackText}>Preview</Text>
                  </View>
                )}
              </View>
              <Text style={styles.previewTime}>{formatTime(seekPosition)}</Text>
            </View>
          )}
          <Slider
            style={styles.slider}
            value={seekPosition}
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
  previewFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFallbackText: {
    color: '#BDBDBD',
    fontSize: 12,
    fontWeight: '600',
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
