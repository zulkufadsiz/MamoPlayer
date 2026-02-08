
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import SettingsDialog from './lib/SettingsDialog';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface LandscapePlayerProps {
  source: VideoSource;
  style?: any;
  autoPlay?: boolean;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  allowsFullscreen?: boolean;
  allowsPictureInPicture?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  subtitles?: Subtitle[];
  onSettingsPress?: () => void;
  title?: string;
  episode?: string;
  season?: string;
  onBack?: () => void;
}

const videoSource =
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

export const LandscapePlayer: React.FC<LandscapePlayerProps> = ({
  source,
  autoPlay = true,
  subtitles = [],
  onSettingsPress,
  title = 'Video Title',
  episode,
  season,
  onBack,
}) => {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.volume = 1;
  });
  const { width, height } = useWindowDimensions();

  useEventListener(player, 'statusChange', ({ status, error }) => {
    console.log('Player status changed: ', status);
    if (status === 'readyToPlay' && autoPlay) {
      player.play();
    }
  });

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [controlsOpacity] = useState(new Animated.Value(1));

  // Lock screen orientation to landscape
  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    };

    lockOrientation();

    // Unlock orientation when component unmounts
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Update time and duration
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && !isSeeking) {
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isSeeking]);

  // Track current subtitle
  useEffect(() => {
    if (!player || subtitles.length === 0) return;

    const subtitle = subtitles.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
    setCurrentSubtitle(subtitle ? subtitle.text : '');
  }, [currentTime, subtitles]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleScreenPress = () => {
    if (!showControls) {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSeek = (value: number) => {
    player.currentTime = value;
    setCurrentTime(value);
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    player.volume = value;
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (player) {
      player.playbackRate = speed;
    }
  };

  const handleSettingsPress = () => {
    setShowSettings(true);
    if (onSettingsPress) {
      onSettingsPress();
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Background */}
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Touch Area for showing controls */}
      <Pressable style={styles.touchArea} onPress={handleScreenPress}>
        {showControls && (
          <Animated.View
            style={[styles.controlsContainer, { opacity: controlsOpacity }]}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
                {(season || episode) && (
                  <Text style={styles.episodeInfo}>
                    {season && `${season}`}
                    {season && episode && ': '}
                    {episode && `${episode}`}
                  </Text>
                )}
              </View>
              <View style={styles.topRightButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowSubtitles(!showSubtitles)}
                >
                  <Ionicons
                    name={showSubtitles ? 'chatbox' : 'chatbox-outline'}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleSettingsPress}
                >
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Play/Pause Button */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => handleSkip(-10)}
              >
                <Ionicons name="play-back" size={36} color="#fff" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => handleSkip(10)}
              >
                <Ionicons name="play-forward" size={36} color="#fff" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              {/* Timeline */}
              <View style={styles.timelineContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  value={currentTime}
                  onValueChange={(value: number) => {
                    setIsSeeking(true);
                    setCurrentTime(value);
                  }}
                  onSlidingComplete={(value: number) => {
                    handleSeek(value);
                    setIsSeeking(false);
                  }}
                  minimumTrackTintColor="#E50914"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#fff"
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <View style={styles.volumeContainer}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setShowVolumeSlider(!showVolumeSlider)}
                  >
                    <Ionicons
                      name={
                        volume === 0
                          ? 'volume-mute'
                          : volume < 0.5
                          ? 'volume-low'
                          : 'volume-high'
                      }
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  {showVolumeSlider && (
                    <Slider
                      style={styles.volumeSlider}
                      minimumValue={0}
                      maximumValue={1}
                      value={volume}
                      onValueChange={handleVolumeChange}
                      minimumTrackTintColor="#fff"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      thumbTintColor="#fff"
                    />
                  )}
                </View>

                <View style={styles.rightControls}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="expand" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Subtitle Display */}
        {showSubtitles && currentSubtitle && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{currentSubtitle}</Text>
          </View>
        )}
      </Pressable>

      <SettingsDialog
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        quality={quality}
        onQualityChange={setQuality}
        autoPlay={autoPlayEnabled}
        onAutoPlayChange={setAutoPlayEnabled}
        showSubtitles={showSubtitles}
        onShowSubtitlesChange={setShowSubtitles}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touchArea: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  episodeInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    bottom: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    minWidth: 50,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeSlider: {
    width: 100,
    height: 40,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  subtitleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
});

export default LandscapePlayer;
