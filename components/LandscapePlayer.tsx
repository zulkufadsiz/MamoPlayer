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

export const LandscapePlayer: React.FC<LandscapePlayerProps> = (props) => {
  return <SimplePlayer {...props} />;
};

export default LandscapePlayer;
