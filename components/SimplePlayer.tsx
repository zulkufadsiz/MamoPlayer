
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  isPictureInPictureSupported,
  VideoView,
  useVideoPlayer,
  type VideoSource,
} from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingIndicator from './lib/LoadingIndicator';
import PlaybackControls from './lib/PlaybackControls';
import SettingsDialog from './lib/SettingsDialog';
import { useTransportControls } from './lib/useTransportControls';

interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

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

interface SimplePlayerProps {
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
  author?: string;
  artwork?: string;
}

const resolveMediaUrl = (source: VideoSource): string | null => {
  if (!source) return null;
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return null;
  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }
  return null;
};

export const SimplePlayer: React.FC<SimplePlayerProps> = ({
  source,
  videoSourcesByLanguage,
  audioTracks,
  defaultAudioTrackId = null,
  autoPlay = false,
  startAt,
  allowsFullscreen = true,
  allowsPictureInPicture = true,
  contentFit = 'contain',
  subtitles = [],
  subtitleTracks = [],
  defaultSubtitleTrackId = null,
  onSettingsPress,
  skipSeconds = 10,
  showSkipButtons = true,
  title,
  author,
  artwork,
  style,
}) => {
  const insets = useSafeAreaInsets();
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
  const mediaUrl = useMemo(() => resolveMediaUrl(resolvedSource), [resolvedSource]);

  const player = useVideoPlayer(resolvedSource, player => {
    player.loop = true;
    player.volume = 0;
  });
  const videoViewRef = useRef<VideoView>(null);
  const { width, height } = useWindowDimensions();
  const hasAppliedStartAt = useRef(false);
  const pictureInPictureSupported = isPictureInPictureSupported();

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [isPictureInPictureActive, setIsPictureInPictureActive] = useState(false);
  const isBuffering = playerStatus === 'loading' || playerStatus === 'buffering';
  const isError = !!errorMessage || playerStatus === 'error';
  const canUsePictureInPicture = allowsPictureInPicture && pictureInPictureSupported;

  // Handle orientation when entering/exiting fullscreen
  useEffect(() => {
    const handleOrientation = async () => {
      if (isFullscreen) {
        // Lock to landscape when fullscreen
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } else {
        // Unlock orientation when exiting fullscreen
        await ScreenOrientation.unlockAsync();
      }
    };

    handleOrientation();

    // Cleanup: unlock on unmount
    return () => {
      if (isFullscreen) {
        ScreenOrientation.unlockAsync();
      }
    };
  }, [isFullscreen]);

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

  const handlePlayPause = () => {
    if (isPlaying) {
        player.pause();
      setIsPlaying(false);
    } else {
        player.play();
      setIsPlaying(true);
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (player) {
      player.playbackRate = speed;
    }
  };

  const handleSkip = (seconds: number) => {
    const duration = player.duration ?? 0;
    const currentTime = player.currentTime ?? 0;
    const nextTime = duration > 0
      ? Math.max(0, Math.min(duration, currentTime + seconds))
      : Math.max(0, currentTime + seconds);
    player.currentTime = nextTime;
  };

  useTransportControls({
    enabled: Boolean(mediaUrl),
    isPlaying,
    mediaUrl,
    title,
    artist: author,
    artwork,
    onPlay: () => {
      if (!isPlaying) {
        player.play();
        setIsPlaying(true);
      }
    },
    onPause: () => {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      }
    },
    onNext: showSkipButtons ? () => handleSkip(skipSeconds) : undefined,
    onPrevious: showSkipButtons ? () => handleSkip(-skipSeconds) : undefined,
  });

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

  const handlePictureInPictureToggle = async () => {
    if (!canUsePictureInPicture || !videoViewRef.current) return;

    try {
      if (isPictureInPictureActive) {
        await videoViewRef.current.stopPictureInPicture();
      } else {
        await videoViewRef.current.startPictureInPicture();
      }
    } catch (error) {
      console.warn('Failed to toggle picture in picture mode', error);
    }
  };
  
  const ContainerComponent = isFullscreen ? SafeAreaView : View;
  const containerStyle = [
    styles.container,
    style,
    isFullscreen && styles.fullscreenContainer,
    isFullscreen && { width, height },
  ];
  
  return (
    <ContainerComponent
      style={containerStyle}
      edges={isFullscreen ? ['left', 'right'] : undefined}
    >
      {isFullscreen && <StatusBar hidden />}
      <VideoView
        ref={videoViewRef}
        style={[
          styles.video,
          isFullscreen && styles.fullscreenVideo,
          isFullscreen && { width, height },
        ]}
        player={player}
        nativeControls={false}
        allowsFullscreen={allowsFullscreen}
        allowsPictureInPicture={allowsPictureInPicture}
        onPictureInPictureStart={() => setIsPictureInPictureActive(true)}
        onPictureInPictureStop={() => setIsPictureInPictureActive(false)}
        contentFit={contentFit}
      />

      {(isBuffering || isError) && (
        <View style={styles.overlay} pointerEvents={isError ? 'auto' : 'none'}>
          {isBuffering && !isError && (
            <View style={styles.overlayCard}>
              <LoadingIndicator size={52} variant="dots" color="#4CFDFF" />
              <Text style={styles.overlayText}>Loading...</Text>
            </View>
          )}
          {isError && (
            <View style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>Playback error</Text>
              <Text style={styles.overlayText}>{errorMessage ?? 'Unable to play video'}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                accessibilityRole="button"
                accessibilityLabel="Retry playback"
                accessibilityHint="Attempts to play the video again"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        player={player}
        duration={player.duration || 0}
        onPlayPause={handlePlayPause}
        onSeek={(time) => {
          player.currentTime = time;
        }}
        onSkipBackward={showSkipButtons ? () => handleSkip(-skipSeconds) : undefined}
        onSkipForward={showSkipButtons ? () => handleSkip(skipSeconds) : undefined}
        skipSeconds={skipSeconds}
        isFullscreen={isFullscreen}
        onFullscreenChange={setIsFullscreen}
        subtitles={activeSubtitles}
        showSubtitles={showSubtitles}
        onSubtitlesToggle={() => setShowSubtitles(!showSubtitles)}
        onSettingsPress={handleSettingsPress}
        allowsPictureInPicture={canUsePictureInPicture}
        isPictureInPictureActive={isPictureInPictureActive}
        onPictureInPictureToggle={handlePictureInPictureToggle}
        hasSubtitles={resolvedSubtitleTracks.length > 0}
        autoHideControls
        autoHideDelayMs={3000}
      />

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
        audioTracks={resolvedAudioTracks}
        selectedAudioTrackId={selectedAudioTrackId}
        onAudioTrackChange={setSelectedAudioTrackId}
        subtitleTracks={resolvedSubtitleTracks}
        selectedSubtitleTrackId={selectedSubtitleTrackId}
        onSubtitleTrackChange={setSelectedSubtitleTrackId}
      />
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
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
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
});

export default SimplePlayer;
