import { useEffect } from 'react';

let TrackPlayerModule: any = null;

try {
  TrackPlayerModule = require('react-native-track-player');
} catch {
  TrackPlayerModule = null;
}

const TrackPlayer = TrackPlayerModule?.default ?? TrackPlayerModule;
const Capability = TrackPlayerModule?.Capability;
const Event = TrackPlayerModule?.Event;
const isTrackPlayerAvailable = Boolean(TrackPlayer && Capability && Event);

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

export const useTransportControls = ({
  enabled = true,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: TransportControlsOptions) => {
  useEffect(() => {
    if (!enabled || !isTrackPlayerAvailable) return;

    const subscriptions = [
      TrackPlayer.addEventListener(Event.RemotePlay, () => onPlay?.()),
      TrackPlayer.addEventListener(Event.RemotePause, () => onPause?.()),
      TrackPlayer.addEventListener(Event.RemoteNext, () => onNext?.()),
      TrackPlayer.addEventListener(Event.RemotePrevious, () => onPrevious?.()),
    ];

    return () => {
      subscriptions.forEach((subscription: any) => subscription.remove());
    };
  }, [enabled, onPlay, onPause, onNext, onPrevious]);
};
