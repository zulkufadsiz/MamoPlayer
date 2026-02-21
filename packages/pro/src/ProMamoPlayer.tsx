import { MamoPlayer, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

const emitAdAnalytics = (
  analytics: AnalyticsConfig | undefined,
  type: 'ad_start' | 'ad_complete' | 'ad_error',
  playbackEvent?: PlaybackEvent,
  fallbackPosition?: number,
) => {
  emitAnalytics(analytics, {
    type,
    position: playbackEvent?.position ?? fallbackPosition ?? 0,
    duration: playbackEvent?.duration,
    playbackEvent,
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
  const pendingSessionEndEventRef = React.useRef<PlaybackEvent | null>(null);
  const adSourceMapRef = React.useRef<Map<string, AdBreak>>(new Map());
  const [isAdMode, setIsAdMode] = React.useState(false);
  const [resumeMainAfterAd, setResumeMainAfterAd] = React.useState(false);
  const [activeSource, setActiveSource] = React.useState<MamoPlayerProps['source']>(rest.source);
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });
  const [adStartedAt, setAdStartedAt] = React.useState<number | null>(null);
  const [overlayTimestamp, setOverlayTimestamp] = React.useState(() => Date.now());
  const hasConfiguredPreroll = React.useMemo(
    () => Boolean(ads?.adBreaks.some((adBreak) => adBreak.type === 'preroll')),
    [ads?.adBreaks],
  );
  const skipButtonEnabled = ads?.skipButtonEnabled === true;
  const skipAfterSeconds = Math.max(0, ads?.skipAfterSeconds ?? 0);

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

  const completeAdPlayback = React.useCallback(
    (playbackEvent?: PlaybackEvent) => {
      const currentAdBreak = adRef.current.currentAdBreak;

      if (currentAdBreak) {
        adRef.current.markAdCompleted(currentAdBreak);
      }

      setIsAdMode(false);
      setActiveSource(mainSourceRef.current);
      setResumeMainAfterAd(true);
      setAdStartedAt(null);

      emitAdAnalytics(analytics, 'ad_complete', playbackEvent, positionRef.current);
    },
    [analytics],
  );

  const failAdPlayback = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      const currentAdBreak = adRef.current.currentAdBreak;

      if (currentAdBreak) {
        adRef.current.markAdCompleted(currentAdBreak);
      }

      setIsAdMode(false);
      setActiveSource(mainSourceRef.current);
      setResumeMainAfterAd(true);
      setAdStartedAt(null);

      emitAdAnalytics(analytics, 'ad_error', playbackEvent, positionRef.current);
    },
    [analytics],
  );

  const beginAdPlayback = React.useCallback(
    (adBreak: { type: 'preroll' | 'midroll' | 'postroll'; offset?: number }, adSource: unknown, playbackEvent?: PlaybackEvent) => {
      adRef.current.markAdStarted(adBreak);
      mainSourceRef.current = rest.source;
      setActiveSource(adSource as MamoPlayerProps['source']);
      setIsAdMode(true);
      setAdStartedAt(Date.now());
      setOverlayTimestamp(Date.now());

      emitAdAnalytics(analytics, 'ad_start', playbackEvent, positionRef.current);
    },
    [analytics, rest.source],
  );

  React.useEffect(() => {
    if (!skipButtonEnabled || skipAfterSeconds <= 0 || !isAdMode || adStartedAt === null) {
      return;
    }

    const interval = setInterval(() => {
      setOverlayTimestamp(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [adStartedAt, isAdMode, skipAfterSeconds, skipButtonEnabled]);

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
      if (adRef.current.isAdPlaying || isAdMode) {
        if (playbackEvent.type === 'ended') {
          completeAdPlayback(playbackEvent);

          const pendingSessionEndEvent = pendingSessionEndEventRef.current;

          if (pendingSessionEndEvent) {
            emitAnalytics(analytics, {
              type: 'session_end',
              position: pendingSessionEndEvent.position,
              duration: pendingSessionEndEvent.duration,
              playbackEvent: pendingSessionEndEvent,
            });
            pendingSessionEndEventRef.current = null;
          }
        }

        if (playbackEvent.type === 'error') {
          failAdPlayback(playbackEvent);

          const pendingSessionEndEvent = pendingSessionEndEventRef.current;

          if (pendingSessionEndEvent) {
            emitAnalytics(analytics, {
              type: 'session_end',
              position: pendingSessionEndEvent.position,
              duration: pendingSessionEndEvent.duration,
              playbackEvent: pendingSessionEndEvent,
            });
            pendingSessionEndEventRef.current = null;
          }
        }

        return;
      }

      if (playbackEvent.type === 'ready') {
        const preroll = ads?.adBreaks.find((adBreak) => adBreak.type === 'preroll');

        if (preroll?.source && !adRef.current.hasPlayedPreroll) {
          const prerollBreak = { type: 'preroll' as const };

          beginAdPlayback(prerollBreak, preroll.source, playbackEvent);
          return;
        }
      }

      if (playbackEvent.type === 'time_update') {
        const ad = adRef.current.getNextAd(playbackEvent.position, false);

        if (ad?.type === 'midroll') {
          const offset = ad.offset;

          if (typeof offset === 'number' && adRef.current.playedMidrolls.has(offset)) {
            return;
          }

          const adBreak = adSourceMapRef.current.get(createAdBreakKey(ad.type, ad.offset));

          if (adBreak?.source) {
            if (typeof offset === 'number') {
              adRef.current.playedMidrolls.add(offset);
            }

            beginAdPlayback(ad, adBreak.source, playbackEvent);
            return;
          }
        }
      }

      const shouldPlayAd =
        playbackEvent.type === 'ended'
          ? adRef.current.getNextAd(playbackEvent.position, true)
          : null;

      if (shouldPlayAd) {
        const adBreak = adSourceMapRef.current.get(
          createAdBreakKey(shouldPlayAd.type, shouldPlayAd.offset),
        );

        if (adBreak?.source) {
          if (shouldPlayAd.type === 'postroll' && !adRef.current.hasPlayedPostroll) {
            emitAnalytics(analytics, {
              type: 'ended',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            pendingSessionEndEventRef.current = playbackEvent;
          }

          beginAdPlayback(shouldPlayAd, adBreak.source, playbackEvent);
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

      if (resumeMainAfterAd && playbackEvent.type === 'play') {
        setResumeMainAfterAd(false);
      }

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
    [
      ads?.adBreaks,
      analytics,
      beginAdPlayback,
      completeAdPlayback,
      failAdPlayback,
      isAdMode,
      onPlaybackEvent,
      restrictions,
      resumeMainAfterAd,
      trackQuartiles,
    ],
  );

  const effectiveAutoPlay = React.useMemo(() => {
    if (isAdMode) {
      return true;
    }

    if (hasConfiguredPreroll && !adRef.current.hasPlayedPreroll) {
      return false;
    }

    if (resumeMainAfterAd) {
      return true;
    }

    return rest.autoPlay;
  }, [hasConfiguredPreroll, isAdMode, resumeMainAfterAd, rest.autoPlay]);

  const skipSecondsRemaining = React.useMemo(() => {
    if (!skipButtonEnabled || skipAfterSeconds <= 0) {
      return 0;
    }

    if (adStartedAt === null) {
      return skipAfterSeconds;
    }

    const elapsedSeconds = Math.floor((overlayTimestamp - adStartedAt) / 1000);
    return Math.max(0, skipAfterSeconds - elapsedSeconds);
  }, [adStartedAt, overlayTimestamp, skipAfterSeconds, skipButtonEnabled]);

  const isSkipDisabled = skipButtonEnabled && skipSecondsRemaining > 0;

  const handleSkipAd = React.useCallback(() => {
    if (isSkipDisabled) {
      return;
    }

    completeAdPlayback();
  }, [completeAdPlayback, isSkipDisabled]);

  return (
    <View style={styles.playerContainer}>
      <MamoPlayer
        {...rest}
        source={activeSource}
        autoPlay={effectiveAutoPlay}
        rate={rate}
        onPlaybackEvent={handlePlaybackEvent}
      />
      {adRef.current.isAdPlaying === true ? (
        <View style={styles.adOverlay}>
          <Text style={styles.adText}>Ad playing...</Text>
          {skipButtonEnabled ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleSkipAd}
              disabled={isSkipDisabled}
              style={[styles.skipButton, isSkipDisabled ? styles.skipButtonDisabled : null]}
            >
              <Text style={styles.skipButtonText}>
                {isSkipDisabled ? `Skip in ${skipSecondsRemaining}s` : 'Skip ad'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  playerContainer: {
    position: 'relative',
  },
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  adText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  skipButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipButtonDisabled: {
    opacity: 0.6,
  },
  skipButtonText: {
    color: '#111111',
    fontSize: 12,
  },
});

export default ProMamoPlayer;
