import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useState } from 'react';
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

interface ZPlayerProps {
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
}
const videoSource =
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

export const ZPlayer: React.FC<ZPlayerProps> = ({ source, autoPlay = false, allowsFullscreen = true, allowsPictureInPicture = true, subtitles = [], onSettingsPress }) => {
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
    <View style={[
      styles.contentContainer,
      isFullscreen && { height: width, width: height },
    ]}>
      <PlaybackControls 
        isPlaying={isPlaying}
        player={player}
        duration={player.duration || 0}
        onPlayPause={handlePlayPause}
        onSeek={(time) => {
          player.setPosition(time);
        }}
        isFullscreen={isFullscreen}
        onFullscreenChange={setIsFullscreen}
        subtitles={subtitles}
        showSubtitles={showSubtitles}
        onSubtitlesToggle={() => setShowSubtitles(!showSubtitles)}
        onSettingsPress={handleSettingsPress}
      />
      <VideoView style={[
        styles.video,
        isFullscreen && { height: width, width: height },
      ]} player={player} nativeControls={false} allowsFullscreen allowsPictureInPicture />
      
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
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 275,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 275,
    position: 'relative',
  },
});

export default ZPlayer;
