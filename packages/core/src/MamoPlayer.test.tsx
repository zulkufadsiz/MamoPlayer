import { act, render } from '@testing-library/react-native';
import React from 'react';
import type { ReactVideoProps, VideoRef } from 'react-native-video';
import { MamoPlayerCore } from './MamoPlayer';

let latestVideoProps: ReactVideoProps | null = null;
let latestVideoInstance: VideoRef | null = null;

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  const VideoMock = React.forwardRef((props: ReactVideoProps, ref: React.Ref<VideoRef>) => {
    latestVideoProps = props;

    const instance: VideoRef = {
      seek: jest.fn(),
      resume: jest.fn(),
      pause: jest.fn(),
      presentFullscreenPlayer: jest.fn(),
      dismissFullscreenPlayer: jest.fn(),
      restoreUserInterfaceForPictureInPictureStopCompleted: jest.fn(),
      save: jest.fn(),
      setVolume: jest.fn(),
      getCurrentPosition: jest.fn(),
      setFullScreen: jest.fn(),
      setSource: jest.fn(),
      enterPictureInPicture: jest.fn(),
      exitPictureInPicture: jest.fn(),
    };

    latestVideoInstance = instance;
    React.useImperativeHandle(ref, () => instance);

    return <View testID="video-mock" />;
  });

  return {
    __esModule: true,
    default: VideoMock,
  };
});

describe('MamoPlayerCore', () => {
  beforeEach(() => {
    latestVideoProps = null;
    latestVideoInstance = null;
    jest.clearAllMocks();
  });

  const setup = (props: Partial<React.ComponentProps<typeof MamoPlayerCore>> = {}) => {
    const onPlaybackEvent = jest.fn();

    render(
      <MamoPlayerCore
        source={{ uri: 'https://example.com/video.mp4' }}
        onPlaybackEvent={onPlaybackEvent}
        {...props}
      />,
    );

    if (!latestVideoProps) {
      throw new Error('Video props were not captured');
    }

    return { onPlaybackEvent };
  };

  it('emits ready and play when loaded with autoPlay enabled', () => {
    const { onPlaybackEvent } = setup();

    act(() => {
      latestVideoProps?.onLoad?.({ duration: 120 } as never);
    });

    expect(onPlaybackEvent).toHaveBeenCalledTimes(2);
    expect(onPlaybackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'ready',
        duration: 120,
        position: 0,
        timestamp: expect.any(Number),
      }),
    );
    expect(onPlaybackEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'play',
        reason: 'auto',
        duration: 120,
        position: 0,
        timestamp: expect.any(Number),
      }),
    );
    expect(latestVideoProps?.paused).toBe(false);
  });

  it('does not emit play when autoPlay is disabled', () => {
    const { onPlaybackEvent } = setup({ autoPlay: false });

    act(() => {
      latestVideoProps?.onLoad?.({ duration: 55 } as never);
    });

    expect(onPlaybackEvent).toHaveBeenCalledTimes(1);
    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ready',
        duration: 55,
        timestamp: expect.any(Number),
      }),
    );
    expect(latestVideoProps?.paused).toBe(true);
  });

  it('respects paused override prop', () => {
    setup({ autoPlay: false, paused: false });
    expect(latestVideoProps?.paused).toBe(false);

    setup({ autoPlay: true, paused: true });
    expect(latestVideoProps?.paused).toBe(true);
  });

  it('forwards ref to underlying video instance', () => {
    const ref = React.createRef<VideoRef>();

    render(
      <MamoPlayerCore
        ref={ref}
        source={{ uri: 'https://example.com/video.mp4' }}
      />,
    );

    expect(ref.current).toBeTruthy();
    expect(ref.current).toBe(latestVideoInstance);
    expect(ref.current?.seek).toEqual(expect.any(Function));
  });

  it('emits time_update, seek, ended, and error events', () => {
    const { onPlaybackEvent } = setup();

    act(() => {
      latestVideoProps?.onLoad?.({ duration: 100 } as never);
      latestVideoProps?.onProgress?.({ currentTime: 10 } as never);
      latestVideoProps?.onSeek?.({ currentTime: 30, seekTime: 30 } as never);
      latestVideoProps?.onEnd?.();
      latestVideoProps?.onError?.({ error: { errorString: 'Network failed' } } as never);
    });

    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'time_update',
        position: 10,
        duration: 100,
        timestamp: expect.any(Number),
      }),
    );
    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'seek',
        reason: 'user',
        position: 30,
        duration: 100,
        timestamp: expect.any(Number),
      }),
    );
    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ended',
        duration: 100,
        position: 30,
        timestamp: expect.any(Number),
      }),
    );
    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        error: { message: 'Network failed' },
        duration: 100,
        position: 30,
        timestamp: expect.any(Number),
      }),
    );
  });

  it('emits buffer_start and buffer_end transitions', () => {
    const { onPlaybackEvent } = setup();

    act(() => {
      latestVideoProps?.onBuffer?.({ isBuffering: true } as never);
      latestVideoProps?.onBuffer?.({ isBuffering: true } as never);
      latestVideoProps?.onBuffer?.({ isBuffering: false } as never);
    });

    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'buffer_start',
        timestamp: expect.any(Number),
      }),
    );
    expect(onPlaybackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'buffer_end',
        timestamp: expect.any(Number),
      }),
    );

    const eventTypes = onPlaybackEvent.mock.calls.map(([event]) => event.type);
    expect(eventTypes.filter((type) => type === 'buffer_start')).toHaveLength(1);
    expect(eventTypes.filter((type) => type === 'buffer_end')).toHaveLength(1);
  });
});
