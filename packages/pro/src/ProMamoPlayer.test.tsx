import type { PlaybackEvent } from '@mamoplayer/core';
import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ProMamoPlayer } from './ProMamoPlayer';
import type { PlayerThemeConfig } from './types/theme';

let latestOnPlaybackEvent: ((event: PlaybackEvent) => void) | undefined;
let latestVideoProps:
  | {
      rate?: number;
      source?: unknown;
      autoPlay?: boolean;
      currentQualityId?: string;
      onQualityChange?: (qualityId: string) => void;
    }
  | undefined;
let latestNativeAdsHandler:
  | ((eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error', payload?: unknown) => void)
  | undefined;
const mockSeek = jest.fn();
const mockLoadAds = jest.fn(async (_adTagUrl: string) => {});
const mockReleaseAds = jest.fn(async () => {});
const mockUnsubscribeAdsEvents = jest.fn();
const mockSubscribeToAdsEvents = jest.fn(
  (
    handler: (
      eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error',
      payload?: unknown,
    ) => void,
  ) => {
    latestNativeAdsHandler = handler;
    return mockUnsubscribeAdsEvents;
  },
);

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MamoPlayerMock = React.forwardRef(({
    onPlaybackEvent,
    rate,
    source,
    autoPlay,
    currentQualityId,
    onQualityChange,
  }: {
    onPlaybackEvent?: (event: PlaybackEvent) => void;
    rate?: number;
    source?: unknown;
    autoPlay?: boolean;
    currentQualityId?: string;
    onQualityChange?: (qualityId: string) => void;
  }, ref: React.Ref<{ seek: (position: number) => void }>) => {
    React.useImperativeHandle(ref, () => ({
      seek: (position: number) => mockSeek(position),
    }));

    latestOnPlaybackEvent = onPlaybackEvent;
    latestVideoProps = { rate, source, autoPlay, currentQualityId, onQualityChange };
    return <View testID="mamoplayer-mock" />;
  });

  MamoPlayerMock.displayName = 'MamoPlayerMock';

  return {
    __esModule: true,
    MamoPlayer: MamoPlayerMock,
  };
});

jest.mock('./ima/nativeBridge', () => ({
  loadAds: (adTagUrl: string) => mockLoadAds(adTagUrl),
  releaseAds: () => mockReleaseAds(),
  subscribeToAdsEvents: (
    handler: (
      eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error',
      payload?: unknown,
    ) => void,
  ) => mockSubscribeToAdsEvents(handler),
}));

describe('ProMamoPlayer', () => {
  beforeEach(() => {
    latestOnPlaybackEvent = undefined;
    latestVideoProps = undefined;
    latestNativeAdsHandler = undefined;
    jest.clearAllMocks();
    jest.useRealTimers();
    mockLoadAds.mockResolvedValue(undefined);
    mockReleaseAds.mockResolvedValue(undefined);
    mockSeek.mockReset();
  });

  const emitPlayback = (event: Partial<PlaybackEvent> & Pick<PlaybackEvent, 'type'>) => {
    if (!latestOnPlaybackEvent) {
      throw new Error('onPlaybackEvent not captured');
    }

    latestOnPlaybackEvent({
      timestamp: Date.now(),
      position: event.position ?? 0,
      duration: event.duration,
      ...event,
    });
  };

  it('maps playback events to analytics events and forwards playback callback', () => {
    const onEvent = jest.fn();
    const onPlaybackEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        analytics={{ onEvent }}
        onPlaybackEvent={onPlaybackEvent}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'play', duration: 100, position: 0 });
      emitPlayback({ type: 'pause', duration: 100, position: 10 });
      emitPlayback({ type: 'buffer_start', duration: 100, position: 20 });
      emitPlayback({ type: 'buffer_end', duration: 100, position: 22 });
      emitPlayback({ type: 'seek', duration: 100, position: 40 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    const analyticsTypes = onEvent.mock.calls.map(([event]) => event.type);

    expect(onPlaybackEvent).toHaveBeenCalledTimes(7);
    expect(analyticsTypes).toEqual(
      expect.arrayContaining([
        'session_start',
        'play',
        'pause',
        'buffer_start',
        'buffer_end',
        'seek',
        'ended',
        'session_end',
      ]),
    );
  });

  it('emits quartile events only once per session and resets after ready', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} analytics={{ onEvent }} />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'time_update', duration: 100, position: 25 });
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
      emitPlayback({ type: 'time_update', duration: 100, position: 50 });
      emitPlayback({ type: 'time_update', duration: 100, position: 75 });
      emitPlayback({ type: 'time_update', duration: 100, position: 100 });
      emitPlayback({ type: 'time_update', duration: 100, position: 100 });
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'time_update', duration: 100, position: 25 });
    });

    const quartileEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'quartile');

    expect(quartileEvents.map((event) => event.quartile)).toEqual([25, 50, 75, 100, 25]);
  });

  it('renders watermark with default position', () => {
    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        watermark={{ text: 'demo-watermark', opacity: 0.3 }}
      />,
    );

    const watermark = getByText('demo-watermark');
    const watermarkStyle = StyleSheet.flatten(watermark.props.style);

    expect(watermarkStyle).toEqual(
      expect.objectContaining({
        position: 'absolute',
        top: 10,
        left: 10,
        fontSize: 12,
        opacity: 0.3,
      }),
    );
    expect(watermark.props.pointerEvents).toBe('none');
  });

  it('randomizes watermark position at configured interval', () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.25);

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        watermark={{ text: 'moving-watermark', randomizePosition: true, intervalMs: 1000 }}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const watermark = getByText('moving-watermark');
    const watermarkStyle = StyleSheet.flatten(watermark.props.style);

    expect(watermarkStyle).toEqual(
      expect.objectContaining({
        top: 25,
        left: 17,
      }),
    );

    randomSpy.mockRestore();
  });

  it('applies themeName styles to ad overlay and watermark text', async () => {
    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/theme-name.mp4' }}
        themeName="light"
        watermark={{ text: 'theme-watermark' }}
        ads={{ adBreaks: [], skipButtonEnabled: true }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/theme-name-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    const adTextStyle = StyleSheet.flatten(getByText('Ad playing...').props.style);
    const skipTextStyle = StyleSheet.flatten(getByText('Skip ad').props.style);
    const watermarkStyle = StyleSheet.flatten(getByText('theme-watermark').props.style);

    expect(adTextStyle.color).toBe('#111827');
    expect(skipTextStyle.color).toBe('#111827');
    expect(watermarkStyle.color).toBe('#111827');
  });

  it('prefers custom theme over themeName for overlay text styling', async () => {
    const customTheme: PlayerThemeConfig = {
      name: 'dark',
      tokens: {
        colors: {
          background: '#0A0A0A',
          backgroundOverlay: '#101010AA',
          primary: '#22C55E',
          primaryText: '#22C55E',
          secondaryText: '#86EFAC',
          accent: '#22C55E',
          danger: '#DC2626',
          border: '#1F2937',
          sliderTrack: '#4B5563',
          sliderThumb: '#22C55E',
        },
        typography: {
          fontFamily: 'System',
          fontSizeSmall: 12,
          fontSizeMedium: 14,
          fontSizeLarge: 20,
        },
        shape: {
          borderRadiusSmall: 8,
          borderRadiusMedium: 12,
          borderRadiusLarge: 16,
        },
      },
    };

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/custom-theme.mp4' }}
        themeName="light"
        theme={customTheme}
        ads={{ adBreaks: [], skipButtonEnabled: true }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/custom-theme-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    const adTextStyle = StyleSheet.flatten(getByText('Ad playing...').props.style);
    const skipTextStyle = StyleSheet.flatten(getByText('Skip ad').props.style);

    expect(adTextStyle.color).toBe('#22C55E');
    expect(skipTextStyle.color).toBe('#22C55E');
  });

  it('blocks restricted seek directions from pro playback callback', () => {
    const onPlaybackEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        restrictions={{ disableSeekingForward: true, disableSeekingBackward: true }}
        onPlaybackEvent={onPlaybackEvent}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 10 });
      emitPlayback({ type: 'seek', duration: 100, position: 20 });
      emitPlayback({ type: 'seek', duration: 100, position: 5 });
      emitPlayback({ type: 'seek', duration: 100, position: 10 });
    });

    expect(onPlaybackEvent).toHaveBeenCalledTimes(2);
    expect(onPlaybackEvent.mock.calls[0][0].type).toBe('ready');
    expect(onPlaybackEvent.mock.calls[1][0]).toEqual(
      expect.objectContaining({ type: 'seek', position: 10 }),
    );
  });

  it('clamps playback rate to maxPlaybackRate', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        restrictions={{ maxPlaybackRate: 1.0 }}
        rate={2}
      />,
    );

    expect(latestVideoProps?.rate).toBe(1.0);
  });

  it('uses defaultQualityId variant URI as initial source when qualities are provided', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-default-quality.mp4' }}
        tracks={{
          defaultQualityId: '720p',
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-auto.m3u8' },
            { id: '720p', label: '720p', uri: 'https://example.com/main-720p.m3u8' },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('720p');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-720p.m3u8' }),
    );
  });

  it('falls back to auto quality when no explicit default is configured', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-auto-fallback.mp4' }}
        tracks={{
          qualities: [
            { id: '720p', label: '720p', uri: 'https://example.com/main-720p-fallback.m3u8' },
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-auto-fallback.m3u8' },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('auto');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-auto-fallback.m3u8' }),
    );
  });

  it('changes quality source and restores previous position after reload ready event', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-quality-switch.mp4' }}
        tracks={{
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-quality-auto.m3u8' },
            { id: '480p', label: '480p', uri: 'https://example.com/main-quality-480p.m3u8' },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 42 });
    });

    act(() => {
      latestVideoProps?.onQualityChange?.('480p');
    });

    expect(latestVideoProps?.currentQualityId).toBe('480p');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-quality-480p.m3u8' }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(mockSeek).toHaveBeenCalledWith(42);
  });

  it('switches to ad source and restores main source after ad ends', () => {
    const mainSource = { uri: 'https://example.com/main.mp4' };
    const adSource = { uri: 'https://example.com/ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);
    expect(latestVideoProps?.autoPlay).toBe(false);

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
    expect(latestVideoProps?.autoPlay).toBe(true);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
    expect(latestVideoProps?.autoPlay).toBe(true);
  });

  it('emits ad_start analytics when preroll begins on ready', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-preroll-start';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('emits ad_start analytics when midroll switches into ad mode', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-midroll-analytics.mp4' }}
        analytics={{ onEvent }}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: { uri: 'https://example.com/midroll-analytics.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
      }),
    );
  });

  it('emits ad_complete analytics when ad playback ends successfully', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-ad-complete';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-for-ad-complete.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll-for-ad-complete.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_complete',
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('emits ad_error analytics when ad video fails to load', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-ad-error';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-for-ad-error.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll-for-ad-error.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({
        type: 'error',
        duration: 5,
        position: 0,
        error: { message: 'Ad load failed' },
      });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_error',
        adPosition: 'preroll',
        errorMessage: 'Ad load failed',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('does not switch source when ads config is missing', () => {
    const mainSource = { uri: 'https://example.com/main-only.mp4' };

    render(<ProMamoPlayer source={mainSource} />);

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('switches to midroll ad only when configured time is reached', () => {
    const mainSource = { uri: 'https://example.com/main-midroll.mp4' };
    const adSource = { uri: 'https://example.com/midroll-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 29 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('plays each midroll only once', () => {
    const mainSource = { uri: 'https://example.com/main-midroll-once.mp4' };
    const adSource = { uri: 'https://example.com/midroll-once-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: adSource,
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
      emitPlayback({ type: 'time_update', duration: 100, position: 45 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('switches to postroll ad only on ended event and then restores main source', () => {
    const mainSource = { uri: 'https://example.com/main-postroll.mp4' };
    const adSource = { uri: 'https://example.com/postroll-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'postroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 99 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('delays session_end analytics until postroll ad ends', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-with-postroll.mp4' }}
        analytics={{ onEvent }}
        ads={{
          adBreaks: [
            {
              type: 'postroll',
              source: { uri: 'https://example.com/postroll-for-session-end.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    const analyticsTypesBeforeAdEnd = onEvent.mock.calls.map(([event]) => event.type);

    expect(analyticsTypesBeforeAdEnd).toContain('ended');
    expect(analyticsTypesBeforeAdEnd).not.toContain('session_end');

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    const analyticsTypesAfterAdEnd = onEvent.mock.calls.map(([event]) => event.type);

    expect(analyticsTypesAfterAdEnd.filter((type) => type === 'session_end')).toHaveLength(1);
  });

  it('loads and subscribes to native IMA on mount and releases on unmount', async () => {
    const view = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-native-ima.mp4' }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/native-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockLoadAds).toHaveBeenCalledWith('https://example.com/native-adtag');
    expect(mockSubscribeToAdsEvents).toHaveBeenCalledTimes(1);

    view.unmount();

    expect(mockUnsubscribeAdsEvents).toHaveBeenCalledTimes(1);
    expect(mockReleaseAds).toHaveBeenCalledTimes(1);
  });

  it('handles native IMA events and falls back to simulated ads after native error', async () => {
    const onEvent = jest.fn();
    const sessionId = 'session-native-ads';
    const nativeAdTagUrl = 'https://example.com/native-adtag-events';
    const adSource = { uri: 'https://example.com/simulated-fallback-preroll.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-native-events.mp4' }}
        analytics={{ onEvent, sessionId }}
        ima={{ enabled: true, adTagUrl: nativeAdTagUrl }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 12 });
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );
    expect(latestVideoProps?.autoPlay).toBe(false);

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_completed', { adPosition: 'preroll' });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_complete',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );
    expect(latestVideoProps?.autoPlay).toBe(true);

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_error', {
        adPosition: 'preroll',
        message: 'native failure',
      });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_error',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        errorMessage: 'native failure',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
  });

  it('falls back to simulated ads when native loadAds fails', async () => {
    mockLoadAds.mockRejectedValueOnce(new Error('native module missing'));

    const adSource = { uri: 'https://example.com/fallback-after-load-failure.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-load-failure.mp4' }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/failing-adtag' }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
  });
});
