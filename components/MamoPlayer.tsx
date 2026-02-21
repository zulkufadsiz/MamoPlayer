import type { PlayerIconSet } from '@/types/icons';
import type { PlayerLayoutVariant } from '@/types/layout';
import { type VideoSource } from 'expo-video';
import React from 'react';
import LandscapePlayer from './LandscapePlayer';
import SimplePlayer from './SimplePlayer';
import VerticalPlayer from './VerticalPlayer';

export interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language?: string;
  subtitles: Subtitle[];
}

export interface MamoPlayerProps {
  source: VideoSource;
  videoSourcesByLanguage?: Record<string, VideoSource>;
  qualitySources?: Record<string, VideoSource>;
  qualitySourcesByLanguage?: Record<string, Record<string, VideoSource>>;
  audioTracks?: {
    id: string;
    label: string;
    language?: string;
  }[];
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
  isPremiumUser?: boolean;
  layoutVariant?: PlayerLayoutVariant;
  playerType?: 'simple' | 'vertical' | 'landscape';
  // VerticalPlayer specific props
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
  // LandscapePlayer specific props
  episode?: string;
  season?: string;
  onBack?: () => void;
}

export const MamoPlayer: React.FC<MamoPlayerProps> = ({ playerType = 'simple', ...props }) => {
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

export default MamoPlayer;
