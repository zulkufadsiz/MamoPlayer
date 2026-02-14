describe('playbackAnalytics', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT;
    delete process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_TOKEN;
    delete process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_NAME;
    delete process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_VALUE;
    global.fetch = undefined as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('logs event and skips network when endpoint is not configured', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      const { trackPlaybackEvent } = require('@/components/lib/playbackAnalytics');
      trackPlaybackEvent({
        type: 'play',
        playerType: 'simple',
        mediaUrl: 'https://example.com/video.m3u8',
      });
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it('skips network when fetch is unavailable', () => {
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT = 'https://api.example.com/events';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      const { trackPlaybackEvent } = require('@/components/lib/playbackAnalytics');
      trackPlaybackEvent({
        type: 'pause',
        playerType: 'vertical',
        mediaUrl: null,
      });
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it('posts payload with authorization and custom header when configured', async () => {
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT = 'https://api.example.com/events';
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_TOKEN = 'token-123';
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_NAME = 'X-API-Key';
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_VALUE = 'key-abc';

    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    let trackPlaybackEvent: (event: any) => void;
    jest.isolateModules(() => {
      trackPlaybackEvent = require('@/components/lib/playbackAnalytics').trackPlaybackEvent;
    });

    trackPlaybackEvent!({
      type: 'seek',
      playerType: 'landscape',
      mediaUrl: 'https://example.com/video.m3u8',
      fromTime: 10,
      toTime: 15,
      duration: 100,
    });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/events');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-123',
      'X-API-Key': 'key-abc',
    });
    expect(JSON.parse(options.body)).toMatchObject({
      type: 'seek',
      playerType: 'landscape',
      mediaUrl: 'https://example.com/video.m3u8',
      fromTime: 10,
      toTime: 15,
      duration: 100,
      timestamp: 1700000000000,
    });

    nowSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('does not add custom header when value is missing', async () => {
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT = 'https://api.example.com/events';
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_NAME = 'X-API-Key';

    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    let trackPlaybackEvent: (event: any) => void;
    jest.isolateModules(() => {
      trackPlaybackEvent = require('@/components/lib/playbackAnalytics').trackPlaybackEvent;
    });

    trackPlaybackEvent!({
      type: 'completion',
      playerType: 'simple',
      mediaUrl: 'https://example.com/video.m3u8',
      currentTime: 100,
      duration: 100,
    });

    await Promise.resolve();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
    });

    logSpy.mockRestore();
  });

  it('handles fetch failures without throwing', async () => {
    process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT = 'https://api.example.com/events';

    const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    let trackPlaybackEvent: (event: any) => void;
    jest.isolateModules(() => {
      trackPlaybackEvent = require('@/components/lib/playbackAnalytics').trackPlaybackEvent;
    });

    trackPlaybackEvent!({
      type: 'play',
      playerType: 'simple',
      mediaUrl: 'https://example.com/video.m3u8',
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
