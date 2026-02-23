describe('playbackPositionStore', () => {
  const setup = () => {
    jest.resetModules();

    const mockFs = {
      documentDirectory: 'file:///docs/',
      getInfoAsync: jest.fn(async (path: string) => ({ exists: path.endsWith('.json') })),
      readAsStringAsync: jest.fn(async () => '{}'),
      writeAsStringAsync: jest.fn(async () => undefined),
    };

    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));

    jest.doMock('react-native', () => mockFs);

    const mod = require('@/components/lib/playbackPositionStore');
    return { mod, mockFs };
  };

  it('saves and returns a resumable playback position', async () => {
    const { mod, mockFs } = setup();

    await mod.savePlaybackPosition('https://example.com/video', 42, 120);
    const position = await mod.getPlaybackPosition('https://example.com/video');

    expect(position).toBe(42);
    expect(mockFs.writeAsStringAsync).toHaveBeenCalled();
  });

  it('does not return resume when position is near end', async () => {
    const { mod } = setup();

    await mod.savePlaybackPosition('https://example.com/video', 119, 120);
    const position = await mod.getPlaybackPosition('https://example.com/video');

    expect(position).toBeNull();
  });

  it('clears stored playback position', async () => {
    const { mod } = setup();

    await mod.savePlaybackPosition('https://example.com/video', 30, 120);
    await mod.clearPlaybackPosition('https://example.com/video');

    const position = await mod.getPlaybackPosition('https://example.com/video');
    expect(position).toBeNull();
  });
});
