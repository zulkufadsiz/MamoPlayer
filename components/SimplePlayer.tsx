
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import PlaybackControls from './lib/PlaybackControls';
import SettingsDialog from './lib/SettingsDialog';

interface Subtitle {
  start: number;
  end: number;
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
}

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
  style,
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

  const player = useVideoPlayer(resolvedSource, player => {
    player.loop = true;
    player.volume = 0;
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

  useEventListener(player, 'statusChange', ({ status, error }) => {
    console.log('Player status changed: ', status, error ?? '');
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

  const handleSettingsPress = () => {
    setShowSettings(true);
    if (onSettingsPress) {
      onSettingsPress();
    }
  };
  
  return (
    <View
      style={[
        styles.container,
        style,
        isFullscreen && styles.fullscreenContainer,
        isFullscreen && { width, height },
      ]}
    >
      <VideoView
        style={[
          styles.video,
          isFullscreen && styles.fullscreenVideo,
          isFullscreen && { width, height },
        ]}
        player={player}
        nativeControls={false}
        allowsFullscreen={allowsFullscreen}
        allowsPictureInPicture={allowsPictureInPicture}
        contentFit={contentFit}
      />

      <PlaybackControls
        isPlaying={isPlaying}
        player={player}
        duration={player.duration || 0}
        onPlayPause={handlePlayPause}
        onSeek={(time) => {
          player.currentTime = time;
        }}
        isFullscreen={isFullscreen}
        onFullscreenChange={setIsFullscreen}
        subtitles={activeSubtitles}
        showSubtitles={showSubtitles}
        onSubtitlesToggle={() => setShowSubtitles(!showSubtitles)}
        onSettingsPress={handleSettingsPress}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
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
