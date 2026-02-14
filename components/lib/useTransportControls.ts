import Constants from 'expo-constants';
import { useEffect } from 'react';

let TrackPlayerModule: TrackPlayerModuleType | null = null;
let hasWarnedUnavailable = false;

const isExpoGo = Constants.appOwnership === 'expo';

try {
  if (!isExpoGo) {
    TrackPlayerModule = require('react-native-track-player');
  }
} catch (error) {
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

const TRACK_ID = 'zplayer-media';
let setupPromise: Promise<void> | null = null;

const buildCapabilities = (canSkipNext: boolean, canSkipPrevious: boolean) => {
  if (!Capability) return [];
  const capabilities = [Capability.Play, Capability.Pause];
  if (canSkipNext) capabilities.push(Capability.SkipToNext);
  if (canSkipPrevious) capabilities.push(Capability.SkipToPrevious);
  return capabilities;
};

const ensureSetup = async () => {
  if (!TrackPlayer || !Capability || !isTrackPlayerAvailable) {
    throw new Error('TrackPlayer native module is not available.');
  }
  if (!setupPromise) {
    setupPromise = TrackPlayer.setupPlayer().then(async () => {
      const capabilities = buildCapabilities(true, true);
      await TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities,
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: capabilities,
      });
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
    if (!isTrackPlayerAvailable) {
      if (!hasWarnedUnavailable) {
        console.warn('TrackPlayer native module not available. Skipping transport controls.');
        hasWarnedUnavailable = true;
      }
      return;
    }
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
    if (!enabled || !isTrackPlayerAvailable) return;

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
    if (!enabled || !mediaUrl || !isTrackPlayerAvailable) return;

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
          if (isPlaying) {
            await TrackPlayer.play();
            const state = await TrackPlayer.getState();
            console.log('TrackPlayer state after add+play:', state);
          }
          return;
        }

        await TrackPlayer.updateMetadataForTrack(queue[0].id ?? TRACK_ID, metadata);
      } catch (error) {
        console.warn('Transport controls metadata update failed', error);
      }
    };

    void updateMetadata();
  }, [artist, artwork, enabled, isPlaying, mediaUrl, title]);

  useEffect(() => {
    if (!enabled || !mediaUrl || !isTrackPlayerAvailable) return;

    const syncState = async () => {
      try {
        await ensureSetup();
        if (isPlaying) {
          await TrackPlayer.play();
          const state = await TrackPlayer.getState();
          console.log('TrackPlayer state after play:', state);
        } else {
          await TrackPlayer.pause();
          const state = await TrackPlayer.getState();
          console.log('TrackPlayer state after pause:', state);
        }
      } catch (error) {
        console.warn('Transport controls state sync failed', error);
      }
    };

    void syncState();
  }, [enabled, isPlaying, mediaUrl]);

  useEffect(() => {
    if (!enabled || !isTrackPlayerAvailable || !Event) return;

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
