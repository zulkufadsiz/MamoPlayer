import { MamoPlayer, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React from 'react';
import { Text, View } from 'react-native';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';
import type { WatermarkConfig } from './types/watermark';

export interface ProMamoPlayerProps extends MamoPlayerProps {
  analytics?: AnalyticsConfig;
  watermark?: WatermarkConfig;
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
  watermark,
  onPlaybackEvent,
  ...rest
}) => {
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });

  React.useEffect(() => {
    if (!watermark?.randomizePosition) {
      setWatermarkPosition({ top: 10, left: 10 });
      return;
    }

    const range = 30;
    const interval = setInterval(() => {
      setWatermarkPosition({
        top: 10 + Math.floor(Math.random() * (range + 1)),
        left: 10 + Math.floor(Math.random() * (range + 1)),
      });
    }, watermark.intervalMs ?? 5000);

    return () => {
      clearInterval(interval);
    };
  }, [watermark]);

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

  return (
    <View style={{ position: 'relative' }}>
      <MamoPlayer {...rest} onPlaybackEvent={handlePlaybackEvent} />
      {watermark ? (
        <Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: watermarkPosition.top,
            left: watermarkPosition.left,
            fontSize: 12,
            opacity: watermark.opacity ?? 0.5,
          }}
        >
          {watermark.text}
        </Text>
      ) : null}
    </View>
  );
};

export default ProMamoPlayer;
