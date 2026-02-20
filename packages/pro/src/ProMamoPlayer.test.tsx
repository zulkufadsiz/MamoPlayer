import type { PlaybackEvent } from '@mamoplayer/core';
import { act, render } from '@testing-library/react-native';
import { ProMamoPlayer } from './ProMamoPlayer';

let latestOnPlaybackEvent: ((event: PlaybackEvent) => void) | undefined;

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    MamoPlayer: ({ onPlaybackEvent }: { onPlaybackEvent?: (event: PlaybackEvent) => void }) => {
      latestOnPlaybackEvent = onPlaybackEvent;
      return <View testID="mamoplayer-mock" />;
    },
  };
});

describe('ProMamoPlayer', () => {
  beforeEach(() => {
    latestOnPlaybackEvent = undefined;
    jest.clearAllMocks();
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
});
