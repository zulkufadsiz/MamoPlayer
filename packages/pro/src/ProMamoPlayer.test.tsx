import type { PlaybackEvent } from '@mamoplayer/core';
import { act, render } from '@testing-library/react-native';
import { ProMamoPlayer } from './ProMamoPlayer';

let latestOnPlaybackEvent: ((event: PlaybackEvent) => void) | undefined;
let latestVideoProps: { rate?: number } | undefined;

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    MamoPlayer: ({
      onPlaybackEvent,
      rate,
    }: {
      onPlaybackEvent?: (event: PlaybackEvent) => void;
      rate?: number;
    }) => {
      latestOnPlaybackEvent = onPlaybackEvent;
      latestVideoProps = { rate };
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
});
