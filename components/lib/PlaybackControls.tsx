import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Timeline from './Timeline';

interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

const parseTimeToSeconds = (value: number | string): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.trim().replace(',', '.');
  if (!normalized) return 0;

  const parts = normalized.split(':');
  if (parts.length > 3) return 0;

  const toNumber = (input: string) => Number.parseFloat(input);
  const parsePart = (input: string) => {
    const parsed = toNumber(input);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  if (parts.length === 3) {
    const hrs = parsePart(parts[0]);
    const mins = parsePart(parts[1]);
    const secs = parsePart(parts[2]);
    if ([hrs, mins, secs].some((part) => Number.isNaN(part))) return 0;
    return Math.max(0, hrs * 3600 + mins * 60 + secs);
  }
  if (parts.length === 2) {
    const mins = parsePart(parts[0]);
    const secs = parsePart(parts[1]);
    if ([mins, secs].some((part) => Number.isNaN(part))) return 0;
    return Math.max(0, mins * 60 + secs);
  }

  const secondsOnly = parsePart(parts[0]);
  if (Number.isNaN(secondsOnly)) return 0;
  return Math.max(0, secondsOnly);
};

interface PlaybackControlsProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
  skipSeconds?: number;
  isFullscreen: boolean;
  onFullscreenChange: (isFullscreen: boolean) => void;
  subtitles?: Subtitle[];
  showSubtitles?: boolean;
  onSubtitlesToggle?: () => void;
  onSettingsPress?: () => void;
  hasSubtitles?: boolean;
  autoHideControls?: boolean;
  autoHideDelayMs?: number;
}

export default function PlaybackControls({
  isPlaying,
  player,
  onPlayPause,
  onSeek,
  onSkipBackward,
  onSkipForward,
  skipSeconds = 10,
  isFullscreen,
  onFullscreenChange,
  subtitles = [],
  showSubtitles = true,
  onSubtitlesToggle,
  onSettingsPress,
  hasSubtitles,
  autoHideControls = false,
  autoHideDelayMs = 3000,
}: PlaybackControlsProps) {
  const { width, height } = useWindowDimensions();
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [controlsVisible, setControlsVisible] = useState(true);

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
        (sub) => {
          const start = parseTimeToSeconds(sub.start);
          const end = parseTimeToSeconds(sub.end);
          return currentTime >= start && currentTime <= end;
        }
      );
      setCurrentSubtitle(subtitle ? subtitle.text : '');
    }, 100);

    return () => clearInterval(interval);
  }, [player, subtitles]);

  const handlePlayPause = () => {
    onPlayPause();
  };

  const showControls = () => {
    setControlsVisible(true);
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

  useEffect(() => {
    if (!autoHideControls) {
      setControlsVisible(true);
      return;
    }

    if (!isPlaying) {
      setControlsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, autoHideDelayMs);

    return () => clearTimeout(timer);
  }, [autoHideControls, autoHideDelayMs, isPlaying, controlsVisible]);

  return (
    <View
      style={[
        styles.container,
        isFullscreen && styles.fullscreenContainer,
      ]}
    >
      {!controlsVisible && autoHideControls && (
        <Pressable
          style={styles.tapToShow}
          onPress={showControls}
        />
      )}

      {controlsVisible && (
        <View style={styles.controlsOverlay}>
        {/* Center Play/Pause Button */}
        <View style={styles.centerControls}>
          {onSkipBackward && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkipBackward}
              activeOpacity={0.7}
            >
              <Ionicons name="play-back" size={28} color="#FFFFFF" />
              <Text style={styles.skipText}>{skipSeconds}</Text>
            </TouchableOpacity>
          )}
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
          {onSkipForward && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkipForward}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={28} color="#FFFFFF" />
              <Text style={styles.skipText}>{skipSeconds}</Text>
            </TouchableOpacity>
          )}
        </View>

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
          {onSubtitlesToggle && (hasSubtitles ?? subtitles.length > 0) && (
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
      )}

      {isFullscreen && controlsVisible && (
        <TouchableOpacity
          style={styles.fullscreenExitButton}
          onPress={handleFullscreen}
          activeOpacity={0.8}
        >
          <Ionicons name="contract" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <View style={styles.subtitleContainer} pointerEvents="none">
          <Text style={styles.subtitleText}>{currentSubtitle}</Text>
        </View>
      )}

       {controlsVisible && (
         <Timeline
              isPlaying={isPlaying}
              player={player}
              duration={player?.duration ?? 0}
              onSeek={onSeek}
            />
       )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tapToShow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipText: {
    position: 'absolute',
    bottom: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  fullscreenExitButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
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
