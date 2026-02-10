export interface TransportControlsOptions {
  enabled?: boolean;
  isPlaying: boolean;
  mediaUrl?: string | null;
  title?: string;
  artist?: string;
  artwork?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const useTransportControls = (_options: TransportControlsOptions) => {};
