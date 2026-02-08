import { type VideoSource } from 'expo-video';
import React from 'react';
import LandscapePlayer from './LandscapePlayer';
import SimplePlayer from './SimplePlayer';
import VerticalPlayer from './VerticalPlayer';

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

interface ZPlayerProps {
  source: VideoSource;
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
  playerType?: 'simple' | 'vertical' | 'landscape';
  // VerticalPlayer specific props
  title?: string;
  description?: string;
  author?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  // LandscapePlayer specific props
  episode?: string;
  season?: string;
  onBack?: () => void;
}

export const ZPlayer: React.FC<ZPlayerProps> = ({ 
  playerType = 'simple',
  ...props 
}) => {
  switch (playerType) {
    case 'vertical':
      return <VerticalPlayer {...props} />;
    case 'landscape':
      return <LandscapePlayer {...props} />;
    case 'simple':
    default:
      return <SimplePlayer {...props} />;
  }
};

export default ZPlayer;
