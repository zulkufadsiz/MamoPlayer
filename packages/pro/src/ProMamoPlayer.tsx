import { MamoPlayer, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import { AdStateMachine } from './ads/AdState';
import type { AdBreak, AdsConfig } from './types/ads';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';
import type { PlaybackRestrictions } from './types/restrictions';
import type { WatermarkConfig } from './types/watermark';

export interface ProMamoPlayerProps extends MamoPlayerProps {
  ads?: AdsConfig;
  analytics?: AnalyticsConfig;
  restrictions?: PlaybackRestrictions;
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

const createAdBreakKey = (type: AdBreak['type'], time?: number) => `${type}:${time ?? 'none'}`;

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
  ads,
  analytics,
  restrictions,
  watermark,
  onPlaybackEvent,
  ...rest
}) => {
  const adRef = useRef(new AdStateMachine());
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());
  const positionRef = React.useRef(0);
  const mainSourceRef = React.useRef(rest.source);
  const adSourceMapRef = React.useRef<Map<string, AdBreak>>(new Map());
  const [isAdMode, setIsAdMode] = React.useState(false);
  const [activeSource, setActiveSource] = React.useState<MamoPlayerProps['source']>(rest.source);
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });

  React.useEffect(() => {
    const adBreaks = ads?.adBreaks;

    if (!adBreaks) {
      adSourceMapRef.current = new Map();
      return;
    }

    adSourceMapRef.current = new Map(
      adBreaks.map((adBreak) => [createAdBreakKey(adBreak.type, adBreak.time), adBreak]),
    );

    adRef.current.setAdBreaks(
      adBreaks.map((adBreak) => ({
        type: adBreak.type,
        offset: adBreak.time,
      })),
    );
  }, [ads?.adBreaks]);

  React.useEffect(() => {
    if (isAdMode) {
      return;
    }

    mainSourceRef.current = rest.source;
    setActiveSource(rest.source);
  }, [isAdMode, rest.source]);

  const rate = React.useMemo(() => {
    if (typeof rest.rate !== 'number') {
      return rest.rate;
    }

    if (typeof restrictions?.maxPlaybackRate !== 'number') {
      return rest.rate;
    }

    return Math.min(rest.rate, restrictions.maxPlaybackRate);
  }, [rest.rate, restrictions?.maxPlaybackRate]);

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
      if (isAdMode) {
        if (playbackEvent.type === 'ended') {
          const currentAdBreak = adRef.current.currentAdBreak;

          if (currentAdBreak) {
            adRef.current.markAdCompleted(currentAdBreak);
          }

          setIsAdMode(false);
          setActiveSource(mainSourceRef.current);
        }

        return;
      }

      const shouldPlayAd = adRef.current.getNextAd(
        playbackEvent.position,
        playbackEvent.type === 'ended',
      );

      if (shouldPlayAd) {
        const adBreak = adSourceMapRef.current.get(
          createAdBreakKey(shouldPlayAd.type, shouldPlayAd.offset),
        );

        if (adBreak?.source) {
          adRef.current.markAdStarted(shouldPlayAd);
          mainSourceRef.current = rest.source;
          setActiveSource(adBreak.source as MamoPlayerProps['source']);
          setIsAdMode(true);
          return;
        }
      }

      const previousPosition = positionRef.current;

      if (playbackEvent.type === 'seek') {
        if (restrictions?.disableSeekingForward && playbackEvent.position > previousPosition) {
          return;
        }

        if (restrictions?.disableSeekingBackward && playbackEvent.position < previousPosition) {
          return;
        }
      }

      positionRef.current = playbackEvent.position;
      onPlaybackEvent?.(playbackEvent);

      if (playbackEvent.type === 'ready') {
        quartileStateRef.current = createQuartileState();
        positionRef.current = playbackEvent.position;
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
    [analytics, isAdMode, onPlaybackEvent, restrictions, rest.source, trackQuartiles],
  );

  return (
    <View style={{ position: 'relative' }}>
      <MamoPlayer
        {...rest}
        source={activeSource}
        rate={rate}
        onPlaybackEvent={handlePlaybackEvent}
      />
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
