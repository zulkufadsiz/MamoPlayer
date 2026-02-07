import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Timeline from './Timeline';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface PlaybackControlsProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  isFullscreen: boolean;
  onFullscreenChange: (isFullscreen: boolean) => void;
  subtitles?: Subtitle[];
  showSubtitles?: boolean;
  onSubtitlesToggle?: () => void;
  onSettingsPress?: () => void;
}

export default function PlaybackControls({
  isPlaying,
  player,
  onPlayPause,
  onSeek,
  isFullscreen,
  onFullscreenChange,
  subtitles = [],
  showSubtitles = true,
  onSubtitlesToggle,
  onSettingsPress,
}: PlaybackControlsProps) {
  const { width, height } = useWindowDimensions();
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  useEffect(() => {
    return () => {
      // Unlock orientation when component unmounts
      if (isFullscreen) {
        ScreenOrientation.unlockAsync();
      }
    };
  }, []);

  // Track current subtitle
  useEffect(() => {
    if (!player || subtitles.length === 0) return;

    const interval = setInterval(() => {
      const currentTime = player.currentTime || 0;
      const subtitle = subtitles.find(
        (sub) => currentTime >= sub.start && currentTime <= sub.end
      );
      setCurrentSubtitle(subtitle ? subtitle.text : '');
    }, 100);

    return () => clearInterval(interval);
  }, [player, subtitles]);

  const handlePlayPause = () => {
    onPlayPause();
  };

  const handleFullscreen = async () => {
    if (!isFullscreen) {
      // Enter fullscreen and lock to landscape
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      onFullscreenChange(true);
    } else {
      // Exit fullscreen and return to portrait orientation
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      onFullscreenChange(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isFullscreen && styles.fullscreenContainer,
      ]}
    >
      <View style={styles.controlsOverlay}>
        {/* Center Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={48}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {onSettingsPress && (
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
          {onSubtitlesToggle && subtitles.length > 0 && (
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={onSubtitlesToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showSubtitles ? 'chatbox' : 'chatbox-outline'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={handleFullscreen}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFullscreen ? 'contract' : 'expand'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <View style={styles.subtitleContainer} pointerEvents="none">
          <Text style={styles.subtitleText}>{currentSubtitle}</Text>
        </View>
      )}

       <Timeline isPlaying={isPlaying}
            player={player}
            onSeek={(time) => {
              player.setPosition(time);
            } } duration={0}      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 275,
    zIndex: 10,
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  fullscreenButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    maxWidth: '90%',
  },
});
