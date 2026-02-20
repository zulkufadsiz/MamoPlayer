import { MamoPlayer, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React from 'react';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';

export interface ProMamoPlayerProps extends MamoPlayerProps {
  analytics?: AnalyticsConfig;
}

type Quartile = 25 | 50 | 75 | 100;

const QUARTILES: Quartile[] = [25, 50, 75, 100];

const createQuartileState = (): Record<Quartile, boolean> => ({
  25: false,
  50: false,
  75: false,
  100: false,
});

const emitAnalytics = (
  analytics: AnalyticsConfig | undefined,
  event: Omit<AnalyticsEvent, 'timestamp'>,
) => {
  if (!analytics) {
    return;
  }

  analytics.onEvent({
    ...event,
    timestamp: Date.now(),
  });
};

export const ProMamoPlayer: React.FC<ProMamoPlayerProps> = ({
  analytics,
  onPlaybackEvent,
  ...rest
}) => {
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());

  const trackQuartiles = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      const duration = playbackEvent.duration;
      const position = playbackEvent.position;

      if (!duration || duration <= 0) {
        return;
      }

      const progress = position / duration;

      QUARTILES.forEach((quartile) => {
        if (!quartileStateRef.current[quartile] && progress >= quartile / 100) {
          quartileStateRef.current[quartile] = true;
          emitAnalytics(analytics, {
            type: 'quartile',
            quartile,
            position,
            duration,
            playbackEvent,
          });
        }
      });
    },
    [analytics],
  );

  const handlePlaybackEvent = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      onPlaybackEvent?.(playbackEvent);

      if (playbackEvent.type === 'ready') {
        quartileStateRef.current = createQuartileState();
      }

      switch (playbackEvent.type) {
        case 'ready':
          emitAnalytics(analytics, {
            type: 'session_start',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'play':
          emitAnalytics(analytics, {
            type: 'play',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'pause':
          emitAnalytics(analytics, {
            type: 'pause',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'ended':
          emitAnalytics(analytics, {
            type: 'ended',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          emitAnalytics(analytics, {
            type: 'session_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'buffer_start':
          emitAnalytics(analytics, {
            type: 'buffer_start',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'buffer_end':
          emitAnalytics(analytics, {
            type: 'buffer_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'seek':
          emitAnalytics(analytics, {
            type: 'seek',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        default:
          break;
      }

      trackQuartiles(playbackEvent);
    },
    [analytics, onPlaybackEvent, trackQuartiles],
  );

  return <MamoPlayer {...rest} onPlaybackEvent={handlePlaybackEvent} />;
};

export default ProMamoPlayer;
