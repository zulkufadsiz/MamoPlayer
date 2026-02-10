import { useEffect } from 'react';
import TrackPlayer, { Capability, Event } from 'react-native-track-player';

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

const TRACK_ID = 'zplayer-media';
let setupPromise: Promise<void> | null = null;

const buildCapabilities = (canSkipNext: boolean, canSkipPrevious: boolean) => {
  const capabilities = [Capability.Play, Capability.Pause];
  if (canSkipNext) capabilities.push(Capability.SkipToNext);
  if (canSkipPrevious) capabilities.push(Capability.SkipToPrevious);
  return capabilities;
};

const ensureSetup = async () => {
  if (!setupPromise) {
    setupPromise = TrackPlayer.setupPlayer().then(async () => {
      const capabilities = buildCapabilities(true, true);
      await TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities,
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: capabilities,
      });
      await TrackPlayer.setVolume(0);
    });
  }

  return setupPromise;
};

export const useTransportControls = ({
  enabled = true,
  isPlaying,
  mediaUrl,
  title,
  artist,
  artwork,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: TransportControlsOptions) => {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const setup = async () => {
      try {
        await ensureSetup();
      } catch (error) {
        console.warn('Transport controls setup failed', error);
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const updateCapabilities = async () => {
      try {
        await ensureSetup();
        const capabilities = buildCapabilities(Boolean(onNext), Boolean(onPrevious));
        await TrackPlayer.updateOptions({
          stopWithApp: false,
          capabilities,
          compactCapabilities: [Capability.Play, Capability.Pause],
          notificationCapabilities: capabilities,
        });
      } catch (error) {
        console.warn('Transport controls capability update failed', error);
      }
    };

    void updateCapabilities();
  }, [enabled, onNext, onPrevious]);

  useEffect(() => {
    if (!enabled || !mediaUrl) return;

    const updateMetadata = async () => {
      try {
        await ensureSetup();
        const queue = await TrackPlayer.getQueue();
        const metadata = {
          title: title ?? 'Now Playing',
          artist,
          artwork,
        };

        if (queue.length === 0 || queue[0].url !== mediaUrl) {
          await TrackPlayer.reset();
          await TrackPlayer.add({
            id: TRACK_ID,
            url: mediaUrl,
            ...metadata,
          });
          return;
        }

        await TrackPlayer.updateMetadataForTrack(queue[0].id ?? TRACK_ID, metadata);
      } catch (error) {
        console.warn('Transport controls metadata update failed', error);
      }
    };

    void updateMetadata();
  }, [artist, artwork, enabled, mediaUrl, title]);

  useEffect(() => {
    if (!enabled || !mediaUrl) return;

    const syncState = async () => {
      try {
        await ensureSetup();
        if (isPlaying) {
          await TrackPlayer.play();
        } else {
          await TrackPlayer.pause();
        }
      } catch (error) {
        console.warn('Transport controls state sync failed', error);
      }
    };

    void syncState();
  }, [enabled, isPlaying, mediaUrl]);

  useEffect(() => {
    if (!enabled) return;

    const subscriptions = [
      TrackPlayer.addEventListener(Event.RemotePlay, () => onPlay?.()),
      TrackPlayer.addEventListener(Event.RemotePause, () => onPause?.()),
      TrackPlayer.addEventListener(Event.RemoteNext, () => onNext?.()),
      TrackPlayer.addEventListener(Event.RemotePrevious, () => onPrevious?.()),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [enabled, onPlay, onPause, onNext, onPrevious]);
};
