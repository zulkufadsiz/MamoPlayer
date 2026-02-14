describe('use-color-scheme (native)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('re-exports react-native useColorScheme', () => {
    const mockUseColorScheme = jest.fn(() => 'dark');

    jest.doMock('react-native', () => ({
      useColorScheme: mockUseColorScheme,
    }));

    const { useColorScheme } = require('@/hooks/use-color-scheme');

    expect(useColorScheme).toBe(mockUseColorScheme);
    expect(useColorScheme()).toBe('dark');
  });
});
