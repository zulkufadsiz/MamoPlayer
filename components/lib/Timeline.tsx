import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TimelineProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onSeek: (time: number) => void;
}

export default function Timeline({
  isPlaying,
  player,
  duration,
  onSeek,
}: TimelineProps) {
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

  return (
    <View style={styles.container}>
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timeText}>{formatTime(seekPosition)}</Text>
        <Slider
          style={styles.slider}
          value={seekPosition}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : player?.duration || 1}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#404040"
          thumbTintColor="#FFFFFF"
        />
        <Text style={styles.timeText}>{formatTime(duration > 0 ? duration : player?.duration || 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    marginBottom: 2,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 30,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
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
