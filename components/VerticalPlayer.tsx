import type { VideoSource } from '@/types/video';
import React from 'react';
import SimplePlayer from './SimplePlayer';

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

export const VerticalPlayer: React.FC<VerticalPlayerProps> = (props) => {
  return <SimplePlayer {...props} />;
};

export default VerticalPlayer;
