import { MamoPlayer, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdStateMachine } from './ads/AdState';
import { loadAds, releaseAds, subscribeToAdsEvents } from './ima/nativeBridge';
import { ThemeProvider, usePlayerTheme } from './theme/ThemeContext';
import type { AdBreak, AdsConfig } from './types/ads';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';
import type { IMAConfig } from './types/ima';
import type { PlaybackRestrictions } from './types/restrictions';
import type { PlayerThemeConfig, ThemeName } from './types/theme';
import type { WatermarkConfig } from './types/watermark';

export interface ProMamoPlayerProps extends MamoPlayerProps {
  ads?: AdsConfig;
  ima?: IMAConfig;
  analytics?: AnalyticsConfig;
  restrictions?: PlaybackRestrictions;
  watermark?: WatermarkConfig;
  themeName?: ThemeName;
  theme?: PlayerThemeConfig;
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

const isAdPosition = (value: unknown): value is NonNullable<AnalyticsEvent['adPosition']> =>
  value === 'preroll' || value === 'midroll' || value === 'postroll';

const getErrorMessageFromUnknown = (payload?: unknown): string | undefined => {
  if (payload instanceof Error) {
    return payload.message;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    message?: unknown;
    errorMessage?: unknown;
    error?: { message?: unknown } | unknown;
  };

  if (typeof payloadRecord.errorMessage === 'string' && payloadRecord.errorMessage.length > 0) {
    return payloadRecord.errorMessage;
  }

  if (typeof payloadRecord.message === 'string' && payloadRecord.message.length > 0) {
    return payloadRecord.message;
  }

  if (
    payloadRecord.error &&
    typeof payloadRecord.error === 'object' &&
    typeof (payloadRecord.error as { message?: unknown }).message === 'string' &&
    ((payloadRecord.error as { message?: string }).message?.length ?? 0) > 0
  ) {
    return (payloadRecord.error as { message: string }).message;
  }

  return undefined;
};

const getErrorMessageFromPlaybackEvent = (playbackEvent?: PlaybackEvent): string | undefined => {
  if (!playbackEvent || playbackEvent.type !== 'error') {
    return undefined;
  }

  return getErrorMessageFromUnknown(playbackEvent.error);
};

const getAdPositionFromPayload = (payload?: unknown): AnalyticsEvent['adPosition'] | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    adPosition?: unknown;
    position?: unknown;
    adBreakType?: unknown;
    breakType?: unknown;
  };

  const candidates = [
    payloadRecord.adPosition,
    payloadRecord.position,
    payloadRecord.adBreakType,
    payloadRecord.breakType,
  ];

  for (const candidate of candidates) {
    if (isAdPosition(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

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
  {
    playbackEvent,
    fallbackPosition,
    adTagUrl,
    adPosition,
    errorMessage,
    mainContentPositionAtAdStart,
  }: {
    playbackEvent?: PlaybackEvent;
    fallbackPosition?: number;
    adTagUrl?: string;
    adPosition?: AnalyticsEvent['adPosition'];
    errorMessage?: string;
    mainContentPositionAtAdStart?: number;
  } = {},
) => {
  emitAnalytics(analytics, {
    type,
    position: playbackEvent?.position ?? fallbackPosition ?? 0,
    duration: playbackEvent?.duration,
    playbackEvent,
    adTagUrl,
    adPosition,
    errorMessage,
    mainContentPositionAtAdStart,
    sessionId: analytics?.sessionId,
  });
};

type OverlayThemePrimitives = {
  colors: Record<string, string | undefined>;
  typography: Record<string, number | string | undefined>;
  shape: Record<string, number | undefined>;
};

const getThemePrimitives = (theme: PlayerThemeConfig): OverlayThemePrimitives => {
  const themeRecord = theme as unknown as {
    tokens?: {
      colors?: Record<string, string | undefined>;
      typography?: Record<string, number | string | undefined>;
      shape?: Record<string, number | undefined>;
    };
    colors?: Record<string, string | undefined>;
    typography?: Record<string, number | string | undefined>;
    shape?: Record<string, number | undefined>;
  };

  return {
    colors: themeRecord.tokens?.colors ?? themeRecord.colors ?? {},
    typography: themeRecord.tokens?.typography ?? themeRecord.typography ?? {},
    shape: themeRecord.tokens?.shape ?? themeRecord.shape ?? {},
  };
};

interface ProMamoPlayerOverlaysProps {
  showAdOverlay: boolean;
  skipButtonEnabled: boolean;
  isSkipDisabled: boolean;
  skipSecondsRemaining: number;
  handleSkipAd: () => void;
  watermark?: WatermarkConfig;
  watermarkPosition: { top: number; left: number };
}

const ProMamoPlayerOverlays: React.FC<ProMamoPlayerOverlaysProps> = ({
  showAdOverlay,
  skipButtonEnabled,
  isSkipDisabled,
  skipSecondsRemaining,
  handleSkipAd,
  watermark,
  watermarkPosition,
}) => {
  const playerTheme = usePlayerTheme();
  const styles = React.useMemo(() => stylesFactory(playerTheme), [playerTheme]);

  return (
    <>
      {showAdOverlay ? (
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
          style={[
            styles.watermarkText,
            {
              top: watermarkPosition.top,
              left: watermarkPosition.left,
              opacity: watermark.opacity ?? 0.5,
            },
          ]}
        >
          {watermark.text}
        </Text>
      ) : null}
    </>
  );
};

export const ProMamoPlayer: React.FC<ProMamoPlayerProps> = ({
  ads,
  ima,
  analytics,
  restrictions,
  watermark,
  theme,
  themeName,
  onPlaybackEvent,
  ...rest
}) => {
  const adRef = useRef(new AdStateMachine());
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());
  const positionRef = React.useRef(0);
  const mainSourceRef = React.useRef(rest.source);
  const pendingSessionEndEventRef = React.useRef<PlaybackEvent | null>(null);
  const adSourceMapRef = React.useRef<Map<string, AdBreak>>(new Map());
  const adMainContentStartPositionRef = React.useRef<number | null>(null);
  const [isAdMode, setIsAdMode] = React.useState(false);
  const [resumeMainAfterAd, setResumeMainAfterAd] = React.useState(false);
  const [activeSource, setActiveSource] = React.useState<MamoPlayerProps['source']>(rest.source);
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });
  const [adStartedAt, setAdStartedAt] = React.useState<number | null>(null);
  const [overlayTimestamp, setOverlayTimestamp] = React.useState(() => Date.now());
  const shouldUseNativeIMA = Boolean(ima?.enabled && ima.adTagUrl);
  const [hasNativeIMAFailed, setHasNativeIMAFailed] = React.useState(false);
  const [isNativeAdPlaying, setIsNativeAdPlaying] = React.useState(false);
  const [isMainContentPausedByNativeAd, setIsMainContentPausedByNativeAd] = React.useState(false);
  const useNativeIMA = shouldUseNativeIMA && !hasNativeIMAFailed;
  const hasConfiguredPreroll = React.useMemo(
    () => Boolean(ads?.adBreaks.some((adBreak) => adBreak.type === 'preroll')),
    [ads?.adBreaks],
  );
  const skipButtonEnabled = ads?.skipButtonEnabled === true;
  const skipAfterSeconds = Math.max(0, ads?.skipAfterSeconds ?? 0);

  React.useEffect(() => {
    if (!shouldUseNativeIMA) {
      setHasNativeIMAFailed(false);
      setIsNativeAdPlaying(false);
      setIsMainContentPausedByNativeAd(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const onNativeAdsError = (payload?: unknown) => {
      const message = getErrorMessageFromUnknown(payload) ?? 'Native IMA ad playback failed.';

      console.error(`[MamoPlayer] ${message}`);
      emitAdAnalytics(analytics, 'ad_error', {
        fallbackPosition: positionRef.current,
        adTagUrl: ima?.adTagUrl,
        adPosition: getAdPositionFromPayload(payload),
        errorMessage: message,
        mainContentPositionAtAdStart:
          adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;

      setIsNativeAdPlaying(false);
      setIsMainContentPausedByNativeAd(false);
      setResumeMainAfterAd(true);
      setHasNativeIMAFailed(true);

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      void releaseAds().catch(() => undefined);
    };

    const initializeNativeIMA = async () => {
      if (!ima?.adTagUrl) {
        return;
      }

      try {
        unsubscribe = subscribeToAdsEvents((eventName, payload) => {
          if (!isMounted) {
            return;
          }

          if (eventName === 'mamo_ads_started') {
            setIsNativeAdPlaying(true);
            setIsMainContentPausedByNativeAd(true);
            setResumeMainAfterAd(false);

            const mainContentPositionAtAdStart = positionRef.current;
            adMainContentStartPositionRef.current = mainContentPositionAtAdStart;

            emitAdAnalytics(analytics, 'ad_start', {
              fallbackPosition: positionRef.current,
              adTagUrl: ima?.adTagUrl,
              adPosition: getAdPositionFromPayload(payload),
              mainContentPositionAtAdStart,
            });
            return;
          }

          if (eventName === 'mamo_ads_completed') {
            setIsNativeAdPlaying(false);
            setIsMainContentPausedByNativeAd(false);
            setResumeMainAfterAd(true);

            emitAdAnalytics(analytics, 'ad_complete', {
              fallbackPosition: positionRef.current,
              adTagUrl: ima?.adTagUrl,
              adPosition: getAdPositionFromPayload(payload),
              mainContentPositionAtAdStart:
                adMainContentStartPositionRef.current ?? positionRef.current,
            });
            adMainContentStartPositionRef.current = null;
            return;
          }

          if (eventName === 'mamo_ads_error') {
            onNativeAdsError(payload);
          }
        });

        await loadAds(ima.adTagUrl);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        onNativeAdsError(error);
      }
    };

    void initializeNativeIMA();

    return () => {
      isMounted = false;

      if (unsubscribe) {
        unsubscribe();
      }

      void releaseAds().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to release native IMA ads.';
        console.error(`[MamoPlayer] ${message}`);
      });
    };
  }, [analytics, ima?.adTagUrl, shouldUseNativeIMA]);

  React.useEffect(() => {
    setHasNativeIMAFailed(false);
    setIsNativeAdPlaying(false);
    setIsMainContentPausedByNativeAd(false);
  }, [rest.source]);

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

      emitAdAnalytics(analytics, 'ad_complete', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: currentAdBreak?.type,
        mainContentPositionAtAdStart:
          adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;
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

      emitAdAnalytics(analytics, 'ad_error', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: currentAdBreak?.type,
        errorMessage: getErrorMessageFromPlaybackEvent(playbackEvent),
        mainContentPositionAtAdStart:
          adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;
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

      const mainContentPositionAtAdStart = playbackEvent?.position ?? positionRef.current;
      adMainContentStartPositionRef.current = mainContentPositionAtAdStart;

      emitAdAnalytics(analytics, 'ad_start', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: adBreak.type,
        mainContentPositionAtAdStart,
      });
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
      // Native IMA path
      if (useNativeIMA) {

        positionRef.current = playbackEvent.position;
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
        return;
      }

      // Simulated ads fallback path
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
      useNativeIMA,
    ],
  );

  const effectiveAutoPlay = React.useMemo(() => {
    if (isMainContentPausedByNativeAd) {
      return false;
    }

    if (useNativeIMA) {
      if (resumeMainAfterAd) {
        return true;
      }

      return rest.autoPlay;
    }

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
  }, [
    hasConfiguredPreroll,
    isAdMode,
    isMainContentPausedByNativeAd,
    resumeMainAfterAd,
    rest.autoPlay,
    useNativeIMA,
  ]);

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
    <ThemeProvider theme={theme} themeName={themeName}>
      <View style={styles.playerContainer}>
        <MamoPlayer
          {...rest}
          source={activeSource}
          autoPlay={effectiveAutoPlay}
          rate={rate}
          onPlaybackEvent={handlePlaybackEvent}
        />
        <ProMamoPlayerOverlays
          showAdOverlay={adRef.current.isAdPlaying === true || isNativeAdPlaying}
          skipButtonEnabled={skipButtonEnabled}
          isSkipDisabled={isSkipDisabled}
          skipSecondsRemaining={skipSecondsRemaining}
          handleSkipAd={handleSkipAd}
          watermark={watermark}
          watermarkPosition={watermarkPosition}
        />
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    position: 'relative',
  },
});

const stylesFactory = (theme: PlayerThemeConfig) => {
  const { colors, typography, shape } = getThemePrimitives(theme);

  const overlayBackgroundColor =
    colors.backgroundOverlay ?? colors.controlBackground ?? colors.background;
  const primaryTextColor = colors.primaryText ?? colors.textPrimary ?? colors.secondaryText;
  const buttonBackgroundColor = colors.primary ?? colors.accent ?? colors.background;
  const textSmallSize =
    (typeof typography.fontSizeSmall === 'number'
      ? typography.fontSizeSmall
      : typeof typography.captionSize === 'number'
        ? typography.captionSize
        : 12);
  const textMediumSize =
    (typeof typography.fontSizeMedium === 'number'
      ? typography.fontSizeMedium
      : typeof typography.bodySize === 'number'
        ? typography.bodySize
        : 14);
  const mediumRadius =
    (typeof shape.borderRadiusMedium === 'number'
      ? shape.borderRadiusMedium
      : typeof shape.radiusMd === 'number'
        ? shape.radiusMd
        : 12);

  return StyleSheet.create({
    adOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      zIndex: 2,
      backgroundColor: overlayBackgroundColor,
    },
    adText: {
      color: primaryTextColor,
      fontSize: textMediumSize,
    },
    skipButton: {
      backgroundColor: buttonBackgroundColor,
      borderRadius: mediumRadius,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    skipButtonDisabled: {
      opacity: 0.6,
    },
    skipButtonText: {
      color: primaryTextColor,
      fontSize: textSmallSize,
    },
    watermarkText: {
      position: 'absolute',
      color: primaryTextColor,
      fontSize: textSmallSize,
    },
  });
};

export default ProMamoPlayer;
