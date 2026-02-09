
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import LandscapeSettingsDialog from './lib/LandscapeSettingsDialog';
import LoadingIndicator from './lib/LoadingIndicator';

interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

const parseTimeToSeconds = (value: number | string): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;

  const parts = value.trim().split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 3) {
    const [hrs, mins, secs] = parts;
    return Math.max(0, hrs * 3600 + mins * 60 + secs);
  }
  if (parts.length === 2) {
    const [mins, secs] = parts;
    return Math.max(0, mins * 60 + secs);
  }
  return 0;
};

interface SubtitleTrack {
  id: string;
  label: string;
  language?: string;
  subtitles: Subtitle[];
}

interface AudioTrack {
  id: string;
  label: string;
  language?: string;
}

interface LandscapePlayerProps {
  source: VideoSource;
  videoSourcesByLanguage?: Record<string, VideoSource>;
  audioTracks?: AudioTrack[];
  defaultAudioTrackId?: string | null;
  style?: any;
  autoPlay?: boolean;
  startAt?: number;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  allowsFullscreen?: boolean;
  allowsPictureInPicture?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  subtitles?: Subtitle[];
  subtitleTracks?: SubtitleTrack[];
  defaultSubtitleTrackId?: string | null;
  onSettingsPress?: () => void;
  skipSeconds?: number;
  showSkipButtons?: boolean;
  title?: string;
  episode?: string;
  season?: string;
  onBack?: () => void;
}

const demoSubtitleTracks: SubtitleTrack[] = [
  {
    id: 'en',
    label: 'English',
    language: 'en',
    subtitles: [
      { start: '00:00:01', end: '00:00:04', text: 'Welcome to the demo video.' },
      { start: '00:00:05', end: '00:00:09', text: 'These are English subtitles.' },
      { start: '00:00:10', end: '00:00:14', text: 'Switch languages in settings.' },
    ],
  },
  {
    id: 'tr',
    label: 'Türkçe',
    language: 'tr',
    subtitles: [
      { start: '00:00:01', end: '00:00:04', text: 'Demo videoya hoş geldiniz.' },
      { start: '00:00:05', end: '00:00:09', text: 'Bunlar Türkçe altyazılar.' },
      { start: '00:00:10', end: '00:00:14', text: 'Ayarlar bölümünden dili değiştirin.' },
    ],
  },
  {
    id: 'es',
    label: 'Español',
    language: 'es',
    subtitles: [
      { start: '00:00:01', end: '00:00:04', text: 'Bienvenido al video de демонстрация.' },
      { start: '00:00:05', end: '00:00:09', text: 'Estos son subtítulos en español.' },
      { start: '00:00:10', end: '00:00:14', text: 'Cambia el idioma en ajustes.' },
    ],
  },
];

export const LandscapePlayer: React.FC<LandscapePlayerProps> = ({
  source,
  videoSourcesByLanguage,
  audioTracks,
  defaultAudioTrackId = null,
  autoPlay = true,
  startAt,
  subtitles = [],
  subtitleTracks = demoSubtitleTracks,
  defaultSubtitleTrackId = null,
  onSettingsPress,
  skipSeconds = 10,
  showSkipButtons = true,
  title = 'Video Title',
  episode,
  season,
  onBack,
}) => {
  const [selectedSubtitleTrackId, setSelectedSubtitleTrackId] = useState<string | null>(
    defaultSubtitleTrackId
  );
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(
    defaultAudioTrackId
  );

  const resolvedSubtitleTracks: SubtitleTrack[] = useMemo(() => {
    if (subtitleTracks.length) return subtitleTracks;
    if (subtitles.length) {
      return [
        {
          id: 'default',
          label: 'Default',
          subtitles,
        },
      ];
    }
    return [];
  }, [subtitleTracks, subtitles]);

  const resolvedAudioTracks: AudioTrack[] = useMemo(() => {
    if (audioTracks?.length) return audioTracks;
    if (!videoSourcesByLanguage) return [];
    return Object.keys(videoSourcesByLanguage).map((key) => {
      const subtitleTrack = resolvedSubtitleTracks.find(
        (track) => track.language === key || track.id === key
      );
      return {
        id: key,
        label: subtitleTrack?.label ?? key,
        language: subtitleTrack?.language ?? key,
      };
    });
  }, [audioTracks, resolvedSubtitleTracks, videoSourcesByLanguage]);

  const resolvedSource = useMemo(() => {
    if (!videoSourcesByLanguage) return source;
    const audioTrackId = selectedAudioTrackId ?? resolvedAudioTracks[0]?.id;
    if (audioTrackId && videoSourcesByLanguage[audioTrackId]) {
      return videoSourcesByLanguage[audioTrackId];
    }
    const selectedTrack = resolvedSubtitleTracks.find(
      (track) => track.id === selectedSubtitleTrackId
    );
    const languageKey = selectedTrack?.language ?? selectedSubtitleTrackId;
    if (languageKey && videoSourcesByLanguage[languageKey]) {
      return videoSourcesByLanguage[languageKey];
    }
    return source;
  }, [
    resolvedSubtitleTracks,
    selectedAudioTrackId,
    selectedSubtitleTrackId,
    source,
    videoSourcesByLanguage,
  ]);

  const player = useVideoPlayer(resolvedSource, (player) => {
    player.loop = false;
    player.volume = 1;
  });
  const { width, height } = useWindowDimensions();
  const hasAppliedStartAt = useRef(false);

  const applyStartAt = () => {
    if (hasAppliedStartAt.current) return false;
    if (typeof startAt !== 'number' || Number.isNaN(startAt)) return false;
    const duration = player.duration ?? 0;
    const clampedTime = duration > 0 ? Math.min(duration, startAt) : startAt;
    player.currentTime = Math.max(0, clampedTime);
    hasAppliedStartAt.current = true;
    return true;
  };

  const [playerStatus, setPlayerStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEventListener(player, 'statusChange', ({ status, error }) => {
    console.log('Player status changed: ', status, error ?? '');
    setPlayerStatus(status);
    if (error) {
      const message = typeof error === 'string' ? error : error.message;
      setErrorMessage(message || 'Playback error');
      return;
    }
    if (status !== 'error') {
      setErrorMessage(null);
    }
    if (status === 'readyToPlay') {
      applyStartAt();
      if (autoPlay) {
        player.play();
      }
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
  const isBuffering = playerStatus === 'loading' || playerStatus === 'buffering';
  const isError = !!errorMessage || playerStatus === 'error';
  useEffect(() => {
    hasAppliedStartAt.current = false;
  }, [resolvedSource, startAt]);

  useEffect(() => {
    if (typeof startAt !== 'number' || Number.isNaN(startAt)) return;

    const interval = setInterval(() => {
      if (hasAppliedStartAt.current) {
        clearInterval(interval);
        return;
      }
      if ((player.duration ?? 0) > 0) {
        applyStartAt();
        if (autoPlay) {
          player.play();
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoPlay, player, startAt]);

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

  // Ensure a valid subtitle track is selected
  useEffect(() => {
    if (resolvedSubtitleTracks.length === 0) {
      setSelectedSubtitleTrackId(null);
      return;
    }

    if (!selectedSubtitleTrackId) {
      setSelectedSubtitleTrackId(defaultSubtitleTrackId ?? resolvedSubtitleTracks[0].id);
      return;
    }

    const exists = resolvedSubtitleTracks.some((track) => track.id === selectedSubtitleTrackId);
    if (!exists) {
      setSelectedSubtitleTrackId(resolvedSubtitleTracks[0].id);
    }
  }, [defaultSubtitleTrackId, resolvedSubtitleTracks, selectedSubtitleTrackId]);

  useEffect(() => {
    if (resolvedAudioTracks.length === 0) {
      setSelectedAudioTrackId(null);
      return;
    }

    if (!selectedAudioTrackId) {
      setSelectedAudioTrackId(defaultAudioTrackId ?? resolvedAudioTracks[0].id);
      return;
    }

    const exists = resolvedAudioTracks.some((track) => track.id === selectedAudioTrackId);
    if (!exists) {
      setSelectedAudioTrackId(resolvedAudioTracks[0].id);
    }
  }, [defaultAudioTrackId, resolvedAudioTracks, selectedAudioTrackId]);

  const activeSubtitleTrack = resolvedSubtitleTracks.find(
    (track) => track.id === selectedSubtitleTrackId
  );
  const activeSubtitles = showSubtitles && activeSubtitleTrack ? activeSubtitleTrack.subtitles : [];

  // Track current subtitle
  useEffect(() => {
    if (!player || activeSubtitles.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const subtitle = activeSubtitles.find(
      (sub) => {
        const start = parseTimeToSeconds(sub.start);
        const end = parseTimeToSeconds(sub.end);
        return currentTime >= start && currentTime <= end;
      }
    );
    setCurrentSubtitle(subtitle ? subtitle.text : '');
  }, [currentTime, activeSubtitles, player]);

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

  const handleRetry = () => {
    setErrorMessage(null);
    setPlayerStatus('loading');
    player.play();
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

      {(isBuffering || isError) && (
        <View style={styles.overlay} pointerEvents={isError ? 'auto' : 'none'}>
          {isBuffering && !isError && (
            <View style={styles.overlayCard}>
              <LoadingIndicator size={56} variant="neon" color="#4CFDFF" />
              <Text style={styles.overlayText}>Loading...</Text>
            </View>
          )}
          {isError && (
            <View style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>Playback error</Text>
              <Text style={styles.overlayText}>{errorMessage ?? 'Unable to play video'}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Touch Area for showing controls */}
      <Pressable style={styles.touchArea} onPress={handleScreenPress}>
        {showControls && (
          <Animated.View
            style={[styles.controlsContainer, { opacity: controlsOpacity }]}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
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
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowSubtitles(!showSubtitles);
                  }}
                >
                  <Ionicons
                    name={showSubtitles ? 'chatbox' : 'chatbox-outline'}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSettingsPress();
                  }}
                >
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Play/Pause Button */}
            <View style={styles.centerControls}>
              {showSkipButtons && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(-skipSeconds)}
                >
                  <Ionicons name="play-back" size={36} color="#fff" />
                  <Text style={styles.skipText}>{skipSeconds}</Text>
                </TouchableOpacity>
              )}

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

              {showSkipButtons && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(skipSeconds)}
                >
                  <Ionicons name="play-forward" size={36} color="#fff" />
                  <Text style={styles.skipText}>{skipSeconds}</Text>
                </TouchableOpacity>
              )}
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

      <LandscapeSettingsDialog
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
        audioTracks={resolvedAudioTracks}
        selectedAudioTrackId={selectedAudioTrackId}
        onAudioTrackChange={setSelectedAudioTrackId}
        subtitleTracks={resolvedSubtitleTracks}
        selectedSubtitleTrackId={selectedSubtitleTrackId}
        onSubtitleTrackChange={setSelectedSubtitleTrackId}
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
  subtitleContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    maxWidth: '80%',
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
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
