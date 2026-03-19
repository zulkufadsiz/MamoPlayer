export type ProDebugConfig = {
  enabled?: boolean;
};

export type DebugSnapshot = {
  playbackState?: string;
  position: number;
  duration?: number;
  buffered?: number;
  selectedQuality?: string;
  selectedSubtitle?: string;
  selectedAudioTrack?: string;
  isBuffering?: boolean;
  isAdPlaying?: boolean;
  pipState?: string;
  lastErrorMessage?: string;
  rebufferCount?: number;
};
