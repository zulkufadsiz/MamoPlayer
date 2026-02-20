import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentsSheet, { type Comment } from './lib/CommentsSheet';
import LoadingIndicator from './lib/LoadingIndicator';
import { trackPlaybackEvent } from './lib/playbackAnalytics';
import { getPlaybackPosition, savePlaybackPosition } from './lib/playbackPositionStore';
import SettingsDialog from './lib/SettingsDialog';
import { useTransportControls } from './lib/useTransportControls';

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

const resolveMediaUrl = (source: VideoSource): string | null => {
  if (!source) return null;
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return null;
  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }
  return null;
};

interface VerticalPlayerProps {
  source: VideoSource;
  videoSourcesByLanguage?: Record<string, VideoSource>;
  qualitySources?: Record<string, VideoSource>;
  qualitySourcesByLanguage?: Record<string, Record<string, VideoSource>>;
  audioTracks?: AudioTrack[];
  defaultAudioTrackId?: string | null;
  style?: any;
  autoPlay?: boolean;
  startAt?: number;
  contentFit?: 'contain' | 'cover' | 'fill';
  onPlayingChange?: (isPlaying: boolean) => void;
  subtitles?: Subtitle[];
  subtitleTracks?: SubtitleTrack[];
  defaultSubtitleTrackId?: string | null;
  onSettingsPress?: () => void;
  skipSeconds?: number;
  showSkipButtons?: boolean;
  title?: string;
  description?: string;
  author?: string;
  artwork?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const VerticalPlayer: React.FC<VerticalPlayerProps> = ({
  source,
  videoSourcesByLanguage,
  qualitySources,
  qualitySourcesByLanguage,
  audioTracks,
  defaultAudioTrackId = null,
  autoPlay = true,
  startAt,
  subtitles = [],
  subtitleTracks = [],
  defaultSubtitleTrackId = null,
  onSettingsPress,
  skipSeconds = 10,
  showSkipButtons = true,
  title,
  description,
  author = 'User',
  artwork,
  likes = 0,
  comments = 0,
  shares = 0,
  onLike,
  onComment,
  onShare,
  onSwipeUp: _onSwipeUp,
  onSwipeDown: _onSwipeDown,
}) => {
  const insets = useSafeAreaInsets();
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

  const resolvedAudioTracks: AudioTrack[] = useMemo(() => {
    if (audioTracks?.length) return audioTracks;
    if (!videoSourcesByLanguage) return [];
    return Object.keys(videoSourcesByLanguage).map((key) => {
      const subtitleTrack = resolvedSubtitleTracks.find(
        (track) => track.language === key || track.id === key,
      );
      return {
        id: key,
        label: subtitleTrack?.label ?? key,
        language: subtitleTrack?.language ?? key,
      };
    });
  }, [audioTracks, resolvedSubtitleTracks, videoSourcesByLanguage]);

  const selectedLanguageKey = useMemo(() => {
    if (!videoSourcesByLanguage) return null;

    const audioTrackId = selectedAudioTrackId ?? resolvedAudioTracks[0]?.id;
    if (audioTrackId && videoSourcesByLanguage[audioTrackId]) {
      return audioTrackId;
    }

    const selectedTrack = resolvedSubtitleTracks.find(
      (track) => track.id === selectedSubtitleTrackId,
    );
    const languageKey = selectedTrack?.language ?? selectedSubtitleTrackId;
    if (languageKey && videoSourcesByLanguage[languageKey]) {
      return languageKey;
    }

    return null;
  }, [
    resolvedAudioTracks,
    resolvedSubtitleTracks,
    selectedAudioTrackId,
    selectedSubtitleTrackId,
    videoSourcesByLanguage,
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
    player.volume = 1;
  });
  const { width: _width, height: _height } = useWindowDimensions();
  const hasAppliedStartAt = useRef(false);
  const hasStartedOnReadyRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const [resumeStartAt, setResumeStartAt] = useState<number | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const effectiveStartAt = resumeStartAt ?? startAt;

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
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'JohnDoe',
      text: 'This is amazing! Love it! 😍',
      timestamp: new Date(Date.now() - 3600000),
      likes: 24,
      isLiked: false,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'SarahSmith',
      text: 'Great video, thanks for sharing!',
      timestamp: new Date(Date.now() - 7200000),
      likes: 15,
      isLiked: false,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'MikeBrown',
      text: "Can't wait for more content like this 🔥",
      timestamp: new Date(Date.now() - 86400000),
      likes: 42,
      isLiked: true,
    },
  ]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [subtitleFontSize, setSubtitleFontSize] = useState(18);
  const [subtitleFontStyle, setSubtitleFontStyle] = useState<'normal' | 'bold' | 'thin' | 'italic'>(
    'normal',
  );
  const [isLiked, setIsLiked] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [controlsOpacity] = useState(new Animated.Value(1));
  const isBuffering = playerStatus === 'loading' || playerStatus === 'buffering';
  const isError = !!errorMessage || playerStatus === 'error';

  const persistPlaybackProgress = async () => {
    if (!mediaUrl) return;

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
    hasAppliedStartAt.current = false;
    hasStartedOnReadyRef.current = false;
    completionTrackedRef.current = false;
    setResumeStartAt(null);
    setResumeReady(false);

    let isCancelled = false;

    const loadResumePosition = async () => {
      if (!mediaUrl) {
        if (!isCancelled) {
          setResumeReady(true);
        }
        return;
      }

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
  }, [mediaUrl]);

  useEffect(() => {
    if (playerStatus !== 'readyToPlay' || !resumeReady || hasStartedOnReadyRef.current) return;

    applyStartAt();
    if (autoPlay) {
      player.play();
      setIsPlaying(true);
    }
    hasStartedOnReadyRef.current = true;
  }, [autoPlay, player, playerStatus, resumeReady, effectiveStartAt]);

  useEffect(() => {
    if (!resumeReady) return;
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
  }, [player, resumeReady, effectiveStartAt]);

  // Lock screen orientation to portrait
  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };

    lockOrientation();

    // Unlock orientation when component unmounts
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

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

  // Track current subtitle
  useEffect(() => {
    if (!player || activeSubtitles.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const interval = setInterval(() => {
      const currentTime = player.currentTime || 0;
      const subtitle = activeSubtitles.find((sub) => {
        const start = parseTimeToSeconds(sub.start);
        const end = parseTimeToSeconds(sub.end);
        return currentTime >= start && currentTime <= end;
      });
      setCurrentSubtitle(subtitle ? subtitle.text : '');
    }, 100);

    return () => clearInterval(interval);
  }, [player, activeSubtitles]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    const { currentTime, duration } = getSafePlaybackSnapshot();
    if (isPlaying) {
      void persistPlaybackProgress();
      player.pause();
      setIsPlaying(false);
      trackPlaybackEvent({
        type: 'pause',
        playerType: 'vertical',
        mediaUrl,
        currentTime,
        duration,
      });
    } else {
      player.play();
      setIsPlaying(true);
      trackPlaybackEvent({
        type: 'play',
        playerType: 'vertical',
        mediaUrl,
        currentTime,
        duration,
      });
    }
  };

  const handleSeek = (time: number) => {
    const { currentTime, duration } = getSafePlaybackSnapshot();
    player.currentTime = time;
    completionTrackedRef.current = false;
    trackPlaybackEvent({
      type: 'seek',
      playerType: 'vertical',
      mediaUrl,
      fromTime: currentTime,
      toTime: time,
      duration,
    });
  };

  const handleScreenPress = () => {
    if (!showControls) {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      handlePlayPause();
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
    void persistPlaybackProgress();
  };

  useEffect(() => {
    if (!mediaUrl) return;

    const interval = setInterval(() => {
      if (!isPlaying) return;
      void persistPlaybackProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, mediaUrl, player]);

  useEffect(() => {
    return () => {
      void persistPlaybackProgress();
    };
  }, [mediaUrl, player]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) return;

      const { currentTime, duration } = getSafePlaybackSnapshot();
      if (duration <= 0) return;

      if (!completionTrackedRef.current && currentTime >= duration - 0.35) {
        completionTrackedRef.current = true;
        trackPlaybackEvent({
          type: 'completion',
          playerType: 'vertical',
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
  }, [isPlaying, mediaUrl, player]);

  useTransportControls({
    enabled: Boolean(mediaUrl),
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
          playerType: 'vertical',
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
          playerType: 'vertical',
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike();
    }
  };

  const handleCommentsPress = () => {
    setShowComments(true);
    if (onComment) {
      onComment();
    }
  };

  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'You',
      text,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
    };
    setCommentsList([newComment, ...commentsList]);
  };

  const handleLikeComment = (commentId: string) => {
    setCommentsList(
      commentsList.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    );
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  return (
    <SafeAreaView style={styles.contentContainer} edges={['top', 'bottom']}>
      <StatusBar hidden />

      {/* Video Background */}
      <VideoView style={styles.video} player={player} nativeControls={false} contentFit="cover" />

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

      {/* Gradient Overlays */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      {/* Main Touch Area for Play/Pause */}
      <Pressable
        style={styles.touchArea}
        onPress={handleScreenPress}
        accessibilityRole="button"
        accessibilityLabel={
          showControls ? (isPlaying ? 'Pause video' : 'Play video') : 'Show playback controls'
        }
        accessibilityHint={showControls ? 'Toggles playback' : 'Shows playback controls'}
      >
        {/* Center Play/Pause Icon */}
        {showControls && (
          <Animated.View style={[styles.centerPlayPause, { opacity: controlsOpacity }]}>
            {showSkipButtons && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => handleSkip(-skipSeconds)}
                accessibilityRole="button"
                accessibilityLabel={`Skip backward ${skipSeconds} seconds`}
                accessibilityHint="Moves playback position backward"
                hitSlop={10}
              >
                <Ionicons name="play-back" size={32} color="#FFFFFF" />
                <Text style={styles.skipText}>{skipSeconds}</Text>
              </TouchableOpacity>
            )}
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={80}
              color="rgba(255, 255, 255, 0.9)"
            />
            {showSkipButtons && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => handleSkip(skipSeconds)}
                accessibilityRole="button"
                accessibilityLabel={`Skip forward ${skipSeconds} seconds`}
                accessibilityHint="Moves playback position forward"
                hitSlop={10}
              >
                <Ionicons name="play-forward" size={32} color="#FFFFFF" />
                <Text style={styles.skipText}>{skipSeconds}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </Pressable>

      {/* Right Side Action Buttons */}
      <View style={[styles.rightActions, { bottom: Math.max(140, insets.bottom + 100) }]}>
        {/* Author Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          accessibilityRole="button"
          accessibilityLabel={`Open ${author} profile`}
          hitSlop={10}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.followButton}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? 'Unlike video' : 'Like video'}
          accessibilityHint="Toggles like on this video"
          hitSlop={10}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={isLiked ? '#FF0050' : '#fff'}
          />
          <Text style={styles.actionText}>{formatCount(likes + (isLiked ? 1 : 0))}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCommentsPress}
          accessibilityRole="button"
          accessibilityLabel="Open comments"
          accessibilityHint="Opens the comments sheet"
          hitSlop={10}
        >
          <Ionicons name="chatbubble-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{formatCount(comments + commentsList.length)}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share video"
          hitSlop={10}
        >
          <Ionicons name="arrow-redo-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{formatCount(shares)}</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          accessibilityHint="Opens playback and subtitle settings"
          hitSlop={10}
        >
          <Ionicons name="ellipsis-horizontal" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Section */}
      <View style={[styles.bottomInfo, { paddingBottom: Math.max(80, insets.bottom + 60) }]}>
        {/* Author Info */}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>@{author}</Text>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <View style={[styles.subtitleContainer, { bottom: Math.max(180, insets.bottom + 140) }]}>
          <Text
            style={[
              styles.subtitleText,
              {
                fontSize: subtitleFontSize,
                color: '#FFFFFF',
                fontWeight:
                  subtitleFontStyle === 'bold'
                    ? '700'
                    : subtitleFontStyle === 'thin'
                      ? '300'
                      : '400',
                fontStyle: subtitleFontStyle === 'italic' ? 'italic' : 'normal',
              },
            ]}
          >
            {currentSubtitle}
          </Text>
        </View>
      )}

      <SettingsDialog
        visible={showSettings}
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
        onSubtitleFontSizeChange={setSubtitleFontSize}
        subtitleFontStyle={subtitleFontStyle}
        onSubtitleFontStyleChange={setSubtitleFontStyle}
        audioTracks={resolvedAudioTracks}
        selectedAudioTrackId={selectedAudioTrackId}
        onAudioTrackChange={setSelectedAudioTrackId}
        subtitleTracks={resolvedSubtitleTracks}
        selectedSubtitleTrackId={selectedSubtitleTrackId}
        onSubtitleTrackChange={setSelectedSubtitleTrackId}
      />

      <CommentsSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={commentsList}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        totalComments={comments + commentsList.length}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerPlayPause: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 24,
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    position: 'absolute',
    bottom: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 24,
    zIndex: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF0050',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    borderWidth: 2,
    borderColor: '#000',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 100,
    paddingHorizontal: 16,
    zIndex: 3,
  },
  authorInfo: {
    gap: 8,
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitleContainer: {
    position: 'absolute',
    left: 16,
    right: 100,
    alignItems: 'center',
    zIndex: 4,
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
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
});

export default VerticalPlayer;
