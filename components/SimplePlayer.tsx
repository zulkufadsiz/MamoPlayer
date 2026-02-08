
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useEffect, useMemo, useState } from 'react';
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

interface SimplePlayerProps {
  source: VideoSource;
  style?: any;
  autoPlay?: boolean;
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
const videoSource =
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

export const SimplePlayer: React.FC<SimplePlayerProps> = ({
  source,
  autoPlay = false,
  allowsFullscreen = true,
  allowsPictureInPicture = true,
  contentFit = 'contain',
  subtitles = [],
  subtitleTracks = [],
  defaultSubtitleTrackId = null,
  onSettingsPress,
  style,
}) => {
    const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.volume = 0;
  });
  const { width, height } = useWindowDimensions();

  useEventListener(player, 'statusChange', ({ status, error }) => {
  console.log('Player status changed: ', status);
  if (status === 'readyToPlay') {
    player.play();
  }
});
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [selectedSubtitleTrackId, setSelectedSubtitleTrackId] = useState<string | null>(
    defaultSubtitleTrackId
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
