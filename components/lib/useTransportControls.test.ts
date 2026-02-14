describe('useTransportControls', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  const mockReactUseEffect = (cleanupCallbacks: Array<() => void>) => {
    jest.doMock('react', () => {
      const actual = jest.requireActual('react');
      return {
        ...actual,
        useEffect: (effect: () => void | (() => void)) => {
          const cleanup = effect();
          if (typeof cleanup === 'function') {
            cleanupCallbacks.push(cleanup);
          }
        },
      };
    });
  };

  it('warns when track player is unavailable', async () => {
    const cleanupCallbacks: Array<() => void> = [];
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    mockReactUseEffect(cleanupCallbacks);
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { appOwnership: 'expo' },
    }));

    const { useTransportControls } = require('@/components/lib/useTransportControls');

    useTransportControls({
      enabled: true,
      isPlaying: false,
      mediaUrl: 'https://example.com/video',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'TrackPlayer native module not available. Skipping transport controls.'
    );
  });

  it('registers listeners and updates player metadata when available', async () => {
    const cleanupCallbacks: Array<() => void> = [];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const remove = jest.fn();
    const mockTrackPlayer = {
      setupPlayer: jest.fn(async () => undefined),
      updateOptions: jest.fn(async () => undefined),
      getQueue: jest.fn(async () => []),
      reset: jest.fn(async () => undefined),
      add: jest.fn(async () => undefined),
      play: jest.fn(async () => undefined),
      pause: jest.fn(async () => undefined),
      getState: jest.fn(async () => 'ready'),
      updateMetadataForTrack: jest.fn(async () => undefined),
      addEventListener: jest.fn(() => ({ remove })),
    };

    mockReactUseEffect(cleanupCallbacks);
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { appOwnership: 'standalone' },
    }));

    jest.doMock('react-native-track-player', () => ({
      __esModule: true,
      default: mockTrackPlayer,
      Capability: {
        Play: 'Play',
        Pause: 'Pause',
        SkipToNext: 'SkipToNext',
        SkipToPrevious: 'SkipToPrevious',
      },
      Event: {
        RemotePlay: 'RemotePlay',
        RemotePause: 'RemotePause',
        RemoteNext: 'RemoteNext',
        RemotePrevious: 'RemotePrevious',
      },
    }));

    const { useTransportControls } = require('@/components/lib/useTransportControls');

    useTransportControls({
      enabled: true,
      isPlaying: true,
      mediaUrl: 'https://example.com/video',
      title: 'Demo',
      onPlay: jest.fn(),
      onPause: jest.fn(),
      onNext: jest.fn(),
      onPrevious: jest.fn(),
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(mockTrackPlayer.setupPlayer).toHaveBeenCalled();
    expect(mockTrackPlayer.updateOptions).toHaveBeenCalled();
    expect(mockTrackPlayer.addEventListener).toHaveBeenCalledTimes(4);

    cleanupCallbacks.forEach((cleanup) => cleanup());
    expect(remove).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
