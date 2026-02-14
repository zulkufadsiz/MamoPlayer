import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TimelineProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onSeek: (time: number) => void;
  isFullscreen?: boolean;
}

export default function Timeline({
  isPlaying,
  player,
  duration,
  onSeek,
  isFullscreen = false,
}: TimelineProps) {
  const insets = useSafeAreaInsets();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSeeking) return;
      const currentTime = player?.currentTime ?? 0;
      setSeekPosition(Number.isFinite(currentTime) ? currentTime : 0);
    }, isPlaying ? 250 : 500);

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
  };

  const handleSlidingComplete = (value: number) => {
    setIsSeeking(false);
    onSeek(value);
  };

  const handleValueChange = (value: number) => {
    setSeekPosition(value);
  };

  const resolvedDuration = duration > 0 ? duration : player?.duration || 0;

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
    flex: 1,
    marginHorizontal: 8,
    height: 44,
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
