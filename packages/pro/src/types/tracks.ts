export type SubtitleTrack = {
  id: string;
  language: string;
  label: string;
  uri: string;
  isDefault?: boolean;
};

export type AudioTrack = {
  id: string;
  language: string;
  label: string;
};

export type VideoQualityId =
  | 'auto'
  | '144p'
  | '240p'
  | '360p'
  | '480p'
  | '720p'
  | '1080p'
  | '1440p'
  | '2160p';

export type QualityVariant = {
  id: VideoQualityId;
  label: string;
  uri: string;
  isDefault?: boolean;
};

export type TracksConfig = {
  qualities?: QualityVariant[];
  audioTracks?: AudioTrack[];
  subtitleTracks?: SubtitleTrack[];
  defaultQualityId?: VideoQualityId;
  defaultAudioTrackId?: string | null;
  defaultSubtitleTrackId?: string | 'off' | null;
};
