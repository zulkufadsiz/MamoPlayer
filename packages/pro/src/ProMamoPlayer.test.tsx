import type { PlaybackEvent } from '@mamoplayer/core';
import { act, render } from '@testing-library/react-native';
import { ProMamoPlayer } from './ProMamoPlayer';

let latestOnPlaybackEvent: ((event: PlaybackEvent) => void) | undefined;
let latestVideoProps: { rate?: number; source?: unknown; autoPlay?: boolean } | undefined;

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    MamoPlayer: ({
      onPlaybackEvent,
      rate,
      source,
      autoPlay,
    }: {
      onPlaybackEvent?: (event: PlaybackEvent) => void;
      rate?: number;
      source?: unknown;
      autoPlay?: boolean;
    }) => {
      latestOnPlaybackEvent = onPlaybackEvent;
      latestVideoProps = { rate, source, autoPlay };
      return <View testID="mamoplayer-mock" />;
    },
  };
});

describe('ProMamoPlayer', () => {
  beforeEach(() => {
    latestOnPlaybackEvent = undefined;
    latestVideoProps = undefined;
    jest.clearAllMocks();
    jest.useRealTimers();
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

    expect(watermark.props.style).toEqual(
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

    expect(watermark.props.style).toEqual(
      expect.objectContaining({
        top: 25,
        left: 17,
      }),
    );

    randomSpy.mockRestore();
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

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main.mp4' }}
        analytics={{ onEvent }}
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
});
