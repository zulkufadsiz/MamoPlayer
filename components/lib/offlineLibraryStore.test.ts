describe('offlineLibraryStore', () => {
  const setup = () => {
    jest.resetModules();

    const mockFs = {
      documentDirectory: 'file:///docs/',
      getInfoAsync: jest.fn(async (path: string) => {
        if (path.endsWith('/mamo-offline-videos/')) return { exists: false };
        if (path.endsWith('.json')) return { exists: true };
        return { exists: true, size: 2048 };
      }),
      readAsStringAsync: jest.fn(async () => '{}'),
      writeAsStringAsync: jest.fn(async () => undefined),
      makeDirectoryAsync: jest.fn(async () => undefined),
      downloadAsync: jest.fn(async (_url: string, target: string) => ({ uri: target })),
      deleteAsync: jest.fn(async () => undefined),
    };

    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));

    jest.doMock('react-native', () => mockFs);

    const mod = require('@/components/lib/offlineLibraryStore');
    return { mod, mockFs };
  };

  it('downloads and stores a video item', async () => {
    const { mod, mockFs } = setup();

    const item = await mod.downloadVideoToLibrary({
      id: 'video-1',
      title: 'Video 1',
      remoteUrl: 'https://example.com/video.mp4',
    });

    const byId = await mod.getOfflineItemById('video-1');

    expect(item.id).toBe('video-1');
    expect(byId?.localUri).toContain('video-1.mp4');
    expect(mockFs.downloadAsync).toHaveBeenCalled();
  });

  it('removes downloaded video and clears item', async () => {
    const { mod, mockFs } = setup();

    await mod.downloadVideoToLibrary({
      id: 'video-2',
      title: 'Video 2',
      remoteUrl: 'https://example.com/video2.mp4',
    });

    await mod.removeOfflineVideo('video-2');
    const byId = await mod.getOfflineItemById('video-2');

    expect(byId).toBeNull();
    expect(mockFs.deleteAsync).toHaveBeenCalled();
  });
});
