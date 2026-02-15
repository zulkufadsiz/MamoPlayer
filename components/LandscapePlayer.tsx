import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
  Animated,
  GestureResponderEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LandscapeSettingsDialog from './lib/LandscapeSettingsDialog';
import LoadingIndicator from './lib/LoadingIndicator';
import { trackPlaybackEvent } from './lib/playbackAnalytics';
import { getPlaybackPosition, savePlaybackPosition } from './lib/playbackPositionStore';
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

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

interface LandscapePlayerProps {
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
  skipSeconds?: number;
  showSkipButtons?: boolean;
  title?: string;
  episode?: string;
  season?: string;
  author?: string;
  artwork?: string;
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
  qualitySources,
  qualitySourcesByLanguage,
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
  allowsPictureInPicture = true,
  contentFit = 'contain',
  title = 'Video Title',
  episode,
  season,
  author,
  artwork,
  onBack,
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
    player.loop = false;
    player.volume = 1;
  });
  const videoViewRef = useRef<VideoView>(null);
  const { width, height } = useWindowDimensions();
  const hasAppliedStartAt = useRef(false);
  const hasStartedOnReadyRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const pictureInPictureSupported = isPictureInPictureSupported();
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [subtitleFontSize, setSubtitleFontSize] = useState(18);
  const [subtitleFontStyle, setSubtitleFontStyle] = useState<'normal' | 'bold' | 'thin' | 'italic'>(
    'normal',
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [brightnessLevel, setBrightnessLevel] = useState(0.6);
  const [zoomScale, setZoomScale] = useState(1);
  const [gestureMessage, setGestureMessage] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [isPictureInPictureActive, setIsPictureInPictureActive] = useState(false);
  const [controlsOpacity] = useState(new Animated.Value(1));
  const isBuffering = playerStatus === 'loading' || playerStatus === 'buffering';
  const isError = !!errorMessage || playerStatus === 'error';
  const canUsePictureInPicture = allowsPictureInPicture && pictureInPictureSupported;
  const gestureModeRef = useRef<'none' | 'volume' | 'brightness' | 'pinch'>('none');
  const gestureMovedRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartVolumeRef = useRef(1);
  const touchStartBrightnessRef = useRef(0.6);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressPressUntilRef = useRef(0);

  const persistPlaybackProgress = async () => {
    if (!mediaUrl) return;

    let mediaDuration = duration;
    let position = currentTime;
    try {
      mediaDuration = player.duration ?? duration;
      position = player.currentTime ?? currentTime;
    } catch {
      return;
    }

    if (!Number.isFinite(mediaDuration) || !Number.isFinite(position) || mediaDuration <= 0) {
      return;
    }

    await savePlaybackPosition(mediaUrl, position, mediaDuration);
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
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

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

  // Lock screen orientation to landscape
  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
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
    (track) => track.id === selectedSubtitleTrackId,
  );
  const activeSubtitles = showSubtitles && activeSubtitleTrack ? activeSubtitleTrack.subtitles : [];

  // Track current subtitle
  useEffect(() => {
    if (!player || activeSubtitles.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const subtitle = activeSubtitles.find((sub) => {
      const start = parseTimeToSeconds(sub.start);
      const end = parseTimeToSeconds(sub.end);
      return currentTime >= start && currentTime <= end;
    });
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
    const snapshotTime = Number.isFinite(currentTime) ? currentTime : 0;
    const snapshotDuration = Number.isFinite(duration) ? duration : 0;
    if (isPlaying) {
      void persistPlaybackProgress();
      player.pause();
      setIsPlaying(false);
      trackPlaybackEvent({
        type: 'pause',
        playerType: 'landscape',
        mediaUrl,
        currentTime: snapshotTime,
        duration: snapshotDuration,
      });
    } else {
      player.play();
      setIsPlaying(true);
      trackPlaybackEvent({
        type: 'play',
        playerType: 'landscape',
        mediaUrl,
        currentTime: snapshotTime,
        duration: snapshotDuration,
      });
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
    const fromTime = Number.isFinite(currentTime) ? currentTime : 0;
    const mediaDuration = Number.isFinite(duration) ? duration : 0;
    player.currentTime = value;
    setCurrentTime(value);
    completionTrackedRef.current = false;
    trackPlaybackEvent({
      type: 'seek',
      playerType: 'landscape',
      mediaUrl,
      fromTime,
      toTime: value,
      duration: mediaDuration,
    });
    void persistPlaybackProgress();
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  useTransportControls({
    enabled: Boolean(mediaUrl),
    isPlaying,
    mediaUrl,
    title,
    artist: author ?? season,
    artwork,
    onPlay: () => {
      if (!isPlaying) {
        const snapshotTime = Number.isFinite(currentTime) ? currentTime : 0;
        const snapshotDuration = Number.isFinite(duration) ? duration : 0;
        player.play();
        setIsPlaying(true);
        trackPlaybackEvent({
          type: 'play',
          playerType: 'landscape',
          mediaUrl,
          currentTime: snapshotTime,
          duration: snapshotDuration,
        });
      }
    },
    onPause: () => {
      if (isPlaying) {
        const snapshotTime = Number.isFinite(currentTime) ? currentTime : 0;
        const snapshotDuration = Number.isFinite(duration) ? duration : 0;
        player.pause();
        setIsPlaying(false);
        trackPlaybackEvent({
          type: 'pause',
          playerType: 'landscape',
          mediaUrl,
          currentTime: snapshotTime,
          duration: snapshotDuration,
        });
      }
    },
    onNext: showSkipButtons ? () => handleSkip(skipSeconds) : undefined,
    onPrevious: showSkipButtons ? () => handleSkip(-skipSeconds) : undefined,
  });

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    player.volume = value;
  };

  useEffect(() => {
    if (!mediaUrl) return;

    const interval = setInterval(() => {
      if (!isPlaying) return;
      void persistPlaybackProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, mediaUrl, player, duration, currentTime]);

  useEffect(() => {
    return () => {
      void persistPlaybackProgress();
    };
  }, [mediaUrl, player, duration, currentTime]);

  useEffect(() => {
    if (!isPlaying || duration <= 0) return;

    if (!completionTrackedRef.current && currentTime >= duration - 0.35) {
      completionTrackedRef.current = true;
      trackPlaybackEvent({
        type: 'completion',
        playerType: 'landscape',
        mediaUrl,
        currentTime,
        duration,
      });
    }

    if (completionTrackedRef.current && currentTime < duration - 2) {
      completionTrackedRef.current = false;
    }
  }, [isPlaying, currentTime, duration, mediaUrl]);

  const showGestureFeedback = (message: string) => {
    setGestureMessage(message);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setGestureMessage(null);
    }, 700);
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

  const handleTouchAreaPress = () => {
    if (Date.now() < suppressPressUntilRef.current) return;
    handleScreenPress();
  };

  const getTouchDistance = (event: GestureResponderEvent) => {
    const [firstTouch, secondTouch] = event.nativeEvent.touches;
    if (!firstTouch || !secondTouch) return 0;
    return Math.hypot(secondTouch.pageX - firstTouch.pageX, secondTouch.pageY - firstTouch.pageY);
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    if (showControls) return;

    const touches = event.nativeEvent.touches;
    if (touches.length >= 2) {
      gestureModeRef.current = 'pinch';
      gestureMovedRef.current = true;
      pinchStartDistanceRef.current = getTouchDistance(event);
      pinchStartZoomRef.current = zoomScale;
      suppressPressUntilRef.current = Date.now() + 350;
      return;
    }

    const firstTouch = touches[0];
    if (!firstTouch) return;
    gestureMovedRef.current = false;
    touchStartYRef.current = firstTouch.locationY;
    touchStartVolumeRef.current = volume;
    touchStartBrightnessRef.current = brightnessLevel;
    gestureModeRef.current = firstTouch.locationX < width / 2 ? 'brightness' : 'volume';
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (showControls) return;

    if (event.nativeEvent.touches.length >= 2) {
      if (gestureModeRef.current !== 'pinch') {
        gestureModeRef.current = 'pinch';
        pinchStartDistanceRef.current = getTouchDistance(event);
        pinchStartZoomRef.current = zoomScale;
      }

      const distance = getTouchDistance(event);
      if (distance <= 0 || pinchStartDistanceRef.current <= 0) return;

      const pinchRatio = distance / pinchStartDistanceRef.current;
      const nextZoom = clamp(pinchStartZoomRef.current * pinchRatio, 1, 2.2);
      setZoomScale(nextZoom);
      gestureMovedRef.current = true;
      showGestureFeedback(`Zoom ${Math.round(nextZoom * 100)}%`);
      return;
    }

    const firstTouch = event.nativeEvent.touches[0];
    if (!firstTouch) return;

    const deltaY = touchStartYRef.current - firstTouch.locationY;
    if (Math.abs(deltaY) < 8) return;

    const ratioDelta = (deltaY / height) * 1.35;
    gestureMovedRef.current = true;
    suppressPressUntilRef.current = Date.now() + 350;

    if (gestureModeRef.current === 'volume') {
      const nextVolume = clamp(touchStartVolumeRef.current + ratioDelta, 0, 1);
      handleVolumeChange(nextVolume);
      showGestureFeedback(`Volume ${Math.round(nextVolume * 100)}%`);
      return;
    }

    if (gestureModeRef.current === 'brightness') {
      const nextBrightness = clamp(touchStartBrightnessRef.current + ratioDelta, 0.1, 1);
      setBrightnessLevel(nextBrightness);
      showGestureFeedback(`Brightness ${Math.round(nextBrightness * 100)}%`);
    }
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    if (showControls) return;

    suppressPressUntilRef.current = Date.now() + 350;
    const wasMoved = gestureMovedRef.current;
    gestureModeRef.current = 'none';
    gestureMovedRef.current = false;

    if (wasMoved) return;

    const changedTouch = event.nativeEvent.changedTouches[0];
    if (!changedTouch) return;

    const now = Date.now();
    const tapPoint = {
      time: now,
      x: changedTouch.locationX,
      y: changedTouch.locationY,
    };

    const previousTap = lastTapRef.current;
    if (
      previousTap &&
      now - previousTap.time < 280 &&
      Math.hypot(tapPoint.x - previousTap.x, tapPoint.y - previousTap.y) < 40
    ) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapRef.current = null;
      const seekDelta = tapPoint.x < width / 2 ? -skipSeconds : skipSeconds;
      handleSkip(seekDelta);
      showGestureFeedback(seekDelta > 0 ? `+${skipSeconds}s` : `-${skipSeconds}s`);
      return;
    }

    lastTapRef.current = tapPoint;
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      handleScreenPress();
      lastTapRef.current = null;
      tapTimeoutRef.current = null;
    }, 280);
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
        ref={videoViewRef}
        style={[styles.video, { transform: [{ scale: zoomScale }] }]}
        player={player}
        nativeControls={false}
        allowsPictureInPicture={allowsPictureInPicture}
        onPictureInPictureStart={() => setIsPictureInPictureActive(true)}
        onPictureInPictureStop={() => setIsPictureInPictureActive(false)}
        contentFit={contentFit}
      />

      <View
        pointerEvents="none"
        style={[styles.brightnessOverlay, { opacity: clamp((1 - brightnessLevel) * 0.6, 0, 0.6) }]}
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

      {/* Touch Area for showing controls */}
      <Pressable
        style={styles.touchArea}
        onPress={handleTouchAreaPress}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        accessible={!showControls}
        accessibilityRole="button"
        accessibilityLabel="Show playback controls"
        accessibilityHint="Shows playback controls when they are hidden"
      >
        {showControls && (
          <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
            {/* Top Bar */}
            <View
              style={[
                styles.topBar,
                {
                  paddingTop: Math.max(20, insets.top + 8),
                  paddingLeft: Math.max(20, insets.left + 12),
                  paddingRight: Math.max(20, insets.right + 12),
                },
              ]}
            >
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
                  accessibilityRole="button"
                  accessibilityLabel={showSubtitles ? 'Hide subtitles' : 'Show subtitles'}
                  accessibilityHint="Toggles subtitle visibility"
                  hitSlop={10}
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
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                  accessibilityHint="Opens playback and subtitle settings"
                  hitSlop={10}
                >
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
                {canUsePictureInPicture && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePictureInPictureToggle();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPictureInPictureActive
                        ? 'Exit picture in picture'
                        : 'Enter picture in picture'
                    }
                    accessibilityHint="Toggles picture in picture mode"
                    hitSlop={10}
                  >
                    <MaterialIcons
                      name={
                        isPictureInPictureActive ? 'picture-in-picture' : 'picture-in-picture-alt'
                      }
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Center Play/Pause Button */}
            <View style={styles.centerControls}>
              {showSkipButtons && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(-skipSeconds)}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip backward ${skipSeconds} seconds`}
                  accessibilityHint="Moves playback position backward"
                  hitSlop={10}
                >
                  <Ionicons name="play-back" size={36} color="#fff" />
                  <Text style={styles.skipText}>{skipSeconds}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={handlePlayPause}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
                accessibilityHint={isPlaying ? 'Pauses playback' : 'Starts playback'}
                hitSlop={10}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={48} color="#fff" />
              </TouchableOpacity>

              {showSkipButtons && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(skipSeconds)}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip forward ${skipSeconds} seconds`}
                  accessibilityHint="Moves playback position forward"
                  hitSlop={10}
                >
                  <Ionicons name="play-forward" size={36} color="#fff" />
                  <Text style={styles.skipText}>{skipSeconds}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Bar */}
            <View
              style={[
                styles.bottomBar,
                {
                  paddingBottom: Math.max(20, insets.bottom + 12),
                  paddingLeft: Math.max(20, insets.left + 12),
                  paddingRight: Math.max(20, insets.right + 12),
                },
              ]}
            >
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
                  accessibilityRole="adjustable"
                  accessibilityLabel="Playback position"
                  accessibilityHint="Adjusts current playback time"
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Subtitle Display */}
        {showSubtitles && currentSubtitle && (
          <View
            style={[
              styles.subtitleContainer,
              {
                bottom: Math.max(80, insets.bottom + 60),
                left: Math.max(40, insets.left + 40),
                right: Math.max(40, insets.right + 40),
              },
            ]}
          >
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

        {gestureMessage && (
          <View style={styles.gestureFeedback} pointerEvents="none">
            <Text style={styles.gestureFeedbackText}>{gestureMessage}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  brightnessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  bottomBar: {},
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
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  gestureFeedback: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 8,
  },
  gestureFeedbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LandscapePlayer;
