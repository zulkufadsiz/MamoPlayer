import type { PlayerIconSet } from '@/types/icons';
import type { PlayerLayoutVariant } from '@/types/layout';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
    VideoView,
    isPictureInPictureSupported,
    useVideoPlayer,
    type VideoSource,
} from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import LoadingIndicator from './lib/LoadingIndicator';
import { trackPlaybackEvent } from './lib/playbackAnalytics';
import PlaybackControls from './lib/PlaybackControls';
import { getPlaybackPosition, savePlaybackPosition } from './lib/playbackPositionStore';
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

export interface SimplePlayerProps {
  source: VideoSource;
  videoSourcesByLanguage?: Record<string, VideoSource>;
  qualitySources?: Record<string, VideoSource>;
  qualitySourcesByLanguage?: Record<string, Record<string, VideoSource>>;
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
  icons?: PlayerIconSet;
  skipSeconds?: number;
  showSkipButtons?: boolean;
  title?: string;
  author?: string;
  artwork?: string;
  isPremiumUser?: boolean;
  layoutVariant?: PlayerLayoutVariant;
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
  qualitySources,
  qualitySourcesByLanguage,
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
  icons,
  skipSeconds = 10,
  showSkipButtons = true,
  title,
  author,
  artwork,
  isPremiumUser = false,
  layoutVariant = 'standard',
  style,
}) => {
  const [selectedSubtitleTrackId, setSelectedSubtitleTrackId] = useState<string | null>(
    defaultSubtitleTrackId,
  );
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(
    defaultAudioTrackId,
  );
  const [quality, setQuality] = useState('Auto');

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

  const availableLanguageSourceKeys = useMemo(() => {
    const keys = new Set<string>();

    if (videoSourcesByLanguage) {
      Object.keys(videoSourcesByLanguage).forEach((key) => keys.add(key));
    }

    if (qualitySourcesByLanguage) {
      Object.keys(qualitySourcesByLanguage).forEach((key) => keys.add(key));
    }

    return Array.from(keys);
  }, [qualitySourcesByLanguage, videoSourcesByLanguage]);

  const resolvedAudioTracks: AudioTrack[] = useMemo(() => {
    if (audioTracks?.length) return audioTracks;
    if (availableLanguageSourceKeys.length === 0) return [];
    return availableLanguageSourceKeys.map((key) => {
      const subtitleTrack = resolvedSubtitleTracks.find(
        (track) => track.language === key || track.id === key,
      );
      return {
        id: key,
        label: subtitleTrack?.label ?? key,
        language: subtitleTrack?.language ?? key,
      };
    });
  }, [audioTracks, availableLanguageSourceKeys, resolvedSubtitleTracks]);

  const selectedLanguageKey = useMemo(() => {
    if (availableLanguageSourceKeys.length === 0) return null;

    const audioTrackId = selectedAudioTrackId ?? resolvedAudioTracks[0]?.id;
    if (audioTrackId && availableLanguageSourceKeys.includes(audioTrackId)) {
      return audioTrackId;
    }

    const selectedTrack = resolvedSubtitleTracks.find(
      (track) => track.id === selectedSubtitleTrackId,
    );
    const languageKey = selectedTrack?.language ?? selectedSubtitleTrackId;
    if (languageKey && availableLanguageSourceKeys.includes(languageKey)) {
      return languageKey;
    }

    return null;
  }, [
    resolvedAudioTracks,
    availableLanguageSourceKeys,
    resolvedSubtitleTracks,
    selectedAudioTrackId,
    selectedSubtitleTrackId,
  ]);

  const resolvedSource = useMemo(() => {
    let baseSource: VideoSource = source;

    if (selectedLanguageKey && videoSourcesByLanguage?.[selectedLanguageKey]) {
      baseSource = videoSourcesByLanguage[selectedLanguageKey];
    }

    const qualityMap =
      (selectedLanguageKey && qualitySourcesByLanguage?.[selectedLanguageKey]) || qualitySources;

    if (qualityMap) {
      const explicitQualitySource = qualityMap[quality];
      if (explicitQualitySource) {
        return explicitQualitySource;
      }

      if (quality === 'Auto' && qualityMap.Auto) {
        return qualityMap.Auto;
      }
    }

    return baseSource;
  }, [
    quality,
    qualitySources,
    qualitySourcesByLanguage,
    selectedLanguageKey,
    source,
    videoSourcesByLanguage,
  ]);

  const qualityOptions = useMemo(() => {
    const sourceMap =
      (selectedLanguageKey && qualitySourcesByLanguage?.[selectedLanguageKey]) || qualitySources;

    const options = sourceMap ? Object.keys(sourceMap) : [];
    if (!options.includes('Auto')) {
      options.unshift('Auto');
    }

    return options;
  }, [qualitySources, qualitySourcesByLanguage, selectedLanguageKey]);

  useEffect(() => {
    if (qualityOptions.length === 0) return;
    if (!qualityOptions.includes(quality)) {
      setQuality('Auto');
    }
  }, [quality, qualityOptions]);

  useEffect(() => {
    setQuality('Auto');
  }, [source]);

  const mediaUrl = useMemo(() => resolveMediaUrl(resolvedSource), [resolvedSource]);

  const player = useVideoPlayer(resolvedSource, (player) => {
    player.loop = true;
    player.volume = 0;
  });
  const videoViewRef = useRef<VideoView>(null);
  const { width, height } = useWindowDimensions();
  const hasAppliedStartAt = useRef(false);
  const hasStartedOnReadyRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const pictureInPictureSupported = isPictureInPictureSupported();
  const [resumeStartAt, setResumeStartAt] = useState<number | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const effectiveStartAt = isPremiumUser ? (resumeStartAt ?? startAt) : startAt;

  const applyStartAt = () => {
    if (hasAppliedStartAt.current) return false;
    if (typeof effectiveStartAt !== 'number' || Number.isNaN(effectiveStartAt)) return false;
    const duration = player.duration ?? 0;
    const clampedTime = duration > 0 ? Math.min(duration, effectiveStartAt) : effectiveStartAt;
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
  });
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    hasAppliedStartAt.current = false;
    hasStartedOnReadyRef.current = false;
    completionTrackedRef.current = false;
    setResumeStartAt(null);
    setResumeReady(!isPremiumUser);

    if (!isPremiumUser || !mediaUrl) {
      return;
    }

    let isCancelled = false;

    const loadResumePosition = async () => {
      const savedPosition = await getPlaybackPosition(mediaUrl);
      if (!isCancelled) {
        setResumeStartAt(savedPosition);
        setResumeReady(true);
      }
    };

    void loadResumePosition();

    return () => {
      isCancelled = true;
    };
  }, [isPremiumUser, mediaUrl]);

  useEffect(() => {
    if (
      playerStatus !== 'readyToPlay' ||
      (isPremiumUser && !resumeReady) ||
      hasStartedOnReadyRef.current
    ) {
      return;
    }

    applyStartAt();
    if (autoPlay) {
      player.play();
      setIsPlaying(true);
    }
    hasStartedOnReadyRef.current = true;
  }, [autoPlay, isPremiumUser, player, playerStatus, resumeReady]);

  useEffect(() => {
    if (isPremiumUser && !resumeReady) return;
    if (playerStatus !== 'readyToPlay') return;
    if (typeof effectiveStartAt !== 'number' || Number.isNaN(effectiveStartAt)) return;

    const interval = setInterval(() => {
      if (hasAppliedStartAt.current) {
        clearInterval(interval);
        return;
      }
      if ((player.duration ?? 0) > 0) {
        applyStartAt();
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [effectiveStartAt, isPremiumUser, player, playerStatus, resumeReady]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [subtitleFontSize, setSubtitleFontSize] = useState(18);
  const [subtitleFontStyle, setSubtitleFontStyle] = useState<'normal' | 'bold' | 'thin' | 'italic'>(
    'normal',
  );
  const [isPictureInPictureActive, setIsPictureInPictureActive] = useState(false);
  const isBuffering = playerStatus === 'loading' || playerStatus === 'buffering';
  const isError = !!errorMessage || playerStatus === 'error';
  const canUsePictureInPicture =
    isPremiumUser && allowsPictureInPicture && pictureInPictureSupported;

  const persistPlaybackProgress = async () => {
    if (!isPremiumUser || !mediaUrl) return;

    let duration = 0;
    let currentTime = 0;
    try {
      duration = player.duration ?? 0;
      currentTime = player.currentTime ?? 0;
    } catch {
      return;
    }

    if (!Number.isFinite(duration) || !Number.isFinite(currentTime) || duration <= 0) return;
    await savePlaybackPosition(mediaUrl, currentTime, duration);
  };

  useEffect(() => {
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) return;

    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      (error) => {
        console.warn('Failed to enforce portrait orientation', error);
      },
    );
  }, [isFullscreen]);

  const handleFullscreenChange = (nextFullscreen: boolean) => {
    setIsFullscreen(nextFullscreen);
  };

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
    (track) => track.id === selectedSubtitleTrackId,
  );
  const activeSubtitles = showSubtitles && activeSubtitleTrack ? activeSubtitleTrack.subtitles : [];

  const getSafePlaybackSnapshot = () => {
    try {
      const currentTime = player.currentTime ?? 0;
      const duration = player.duration ?? 0;
      return {
        currentTime: Number.isFinite(currentTime) ? currentTime : 0,
        duration: Number.isFinite(duration) ? duration : 0,
      };
    } catch {
      return { currentTime: 0, duration: 0 };
    }
  };

  const handlePlayPause = () => {
    const { currentTime, duration } = getSafePlaybackSnapshot();
    if (isPlaying) {
      if (isPremiumUser) {
        void persistPlaybackProgress();
      }
      player.pause();
      setIsPlaying(false);
      if (isPremiumUser) {
        trackPlaybackEvent({
          type: 'pause',
          playerType: 'simple',
          mediaUrl,
          currentTime,
          duration,
        });
      }
    } else {
      player.play();
      setIsPlaying(true);
      if (isPremiumUser) {
        trackPlaybackEvent({
          type: 'play',
          playerType: 'simple',
          mediaUrl,
          currentTime,
          duration,
        });
      }
    }
  };

  const handleSeek = (time: number) => {
    const { currentTime, duration } = getSafePlaybackSnapshot();
    player.currentTime = time;
    completionTrackedRef.current = false;

    if (isPremiumUser) {
      trackPlaybackEvent({
        type: 'seek',
        playerType: 'simple',
        mediaUrl,
        fromTime: currentTime,
        toTime: time,
        duration,
      });
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
    const nextTime =
      duration > 0
        ? Math.max(0, Math.min(duration, currentTime + seconds))
        : Math.max(0, currentTime + seconds);
    handleSeek(nextTime);
  };

  useEffect(() => {
    if (!isPremiumUser || !mediaUrl) return;

    const interval = setInterval(() => {
      if (!isPlaying) return;
      void persistPlaybackProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, isPremiumUser, mediaUrl]);

  useEffect(() => {
    if (!isPremiumUser) return;

    return () => {
      void persistPlaybackProgress();
    };
  }, [isPremiumUser, mediaUrl]);

  useEffect(() => {
    if (!isPremiumUser) return;

    const interval = setInterval(() => {
      if (!isPlaying) return;

      const { currentTime, duration } = getSafePlaybackSnapshot();
      if (duration <= 0) return;

      if (!completionTrackedRef.current && currentTime >= duration - 0.35) {
        completionTrackedRef.current = true;
        trackPlaybackEvent({
          type: 'completion',
          playerType: 'simple',
          mediaUrl,
          currentTime,
          duration,
        });
      }

      if (completionTrackedRef.current && currentTime < duration - 2) {
        completionTrackedRef.current = false;
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, isPremiumUser, mediaUrl]);

  useTransportControls({
    enabled: isPremiumUser && Boolean(mediaUrl),
    isPlaying,
    mediaUrl,
    title,
    artist: author,
    artwork,
    onPlay: () => {
      if (!isPlaying) {
        const { currentTime, duration } = getSafePlaybackSnapshot();
        player.play();
        setIsPlaying(true);
        trackPlaybackEvent({
          type: 'play',
          playerType: 'simple',
          mediaUrl,
          currentTime,
          duration,
        });
      }
    },
    onPause: () => {
      if (isPlaying) {
        const { currentTime, duration } = getSafePlaybackSnapshot();
        player.pause();
        setIsPlaying(false);
        trackPlaybackEvent({
          type: 'pause',
          playerType: 'simple',
          mediaUrl,
          currentTime,
          duration,
        });
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

  const renderPlayerContent = (fullscreen: boolean) => {
    const containerStyle = [
      styles.container,
      !fullscreen && style,
      fullscreen && styles.fullscreenContainer,
      fullscreen && { width, height },
    ];

    return (
      <View style={containerStyle}>
        {fullscreen && <StatusBar hidden />}
        <VideoView
          ref={videoViewRef}
          style={[
            styles.video,
            fullscreen && styles.fullscreenVideo,
            fullscreen && { width, height },
          ]}
          player={player}
          nativeControls={false}
          allowsFullscreen={allowsFullscreen}
          allowsPictureInPicture={canUsePictureInPicture}
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
          mediaUrl={mediaUrl}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          icons={icons}
          onSkipBackward={showSkipButtons ? () => handleSkip(-skipSeconds) : undefined}
          onSkipForward={showSkipButtons ? () => handleSkip(skipSeconds) : undefined}
          skipSeconds={skipSeconds}
          isFullscreen={isFullscreen}
          onFullscreenChange={handleFullscreenChange}
          subtitles={activeSubtitles}
          showSubtitles={showSubtitles}
          subtitleFontSize={subtitleFontSize}
          subtitleFontStyle={subtitleFontStyle}
          onSubtitlesToggle={() => setShowSubtitles(!showSubtitles)}
          onSettingsPress={handleSettingsPress}
          settingsOpen={showSettings}
          allowsPictureInPicture={canUsePictureInPicture}
          isPictureInPictureActive={isPictureInPictureActive}
          onPictureInPictureToggle={handlePictureInPictureToggle}
          hasSubtitles={resolvedSubtitleTracks.length > 0}
          layoutVariant={layoutVariant}
          autoHideControls
          autoHideDelayMs={3000}
        />
      </View>
    );
  };

  const renderSettingsDialog = () => (
    <SettingsDialog
      visible={showSettings}
      renderInPlace={isFullscreen}
      onClose={() => setShowSettings(false)}
      playbackSpeed={playbackSpeed}
      onPlaybackSpeedChange={handlePlaybackSpeedChange}
      quality={quality}
      onQualityChange={setQuality}
      qualityOptions={qualityOptions}
      autoPlay={autoPlayEnabled}
      onAutoPlayChange={setAutoPlayEnabled}
      showSubtitles={showSubtitles}
      onShowSubtitlesChange={setShowSubtitles}
      subtitleFontSize={subtitleFontSize}
      onSubtitleFontSizeChange={isPremiumUser ? setSubtitleFontSize : undefined}
      subtitleFontStyle={subtitleFontStyle}
      onSubtitleFontStyleChange={isPremiumUser ? setSubtitleFontStyle : undefined}
      audioTracks={resolvedAudioTracks}
      selectedAudioTrackId={selectedAudioTrackId}
      onAudioTrackChange={setSelectedAudioTrackId}
      subtitleTracks={resolvedSubtitleTracks}
      selectedSubtitleTrackId={selectedSubtitleTrackId}
      onSubtitleTrackChange={setSelectedSubtitleTrackId}
    />
  );

  return (
    <>
      {renderPlayerContent(false)}
      {!isFullscreen && renderSettingsDialog()}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        supportedOrientations={[
          'portrait',
          'portrait-upside-down',
          'landscape',
          'landscape-left',
          'landscape-right',
        ]}
        onShow={() => {
          void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(
            (error) => {
              console.warn('Failed to lock landscape orientation', error);
            },
          );
        }}
        onDismiss={() => {
          void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
            (error) => {
              console.warn('Failed to restore portrait orientation', error);
            },
          );
        }}
        onRequestClose={() => handleFullscreenChange(false)}
      >
        {renderPlayerContent(true)}
        {isFullscreen && renderSettingsDialog()}
      </Modal>
    </>
  );
};

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
    flex: 1,
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
