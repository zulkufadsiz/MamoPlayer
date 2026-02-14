describe('use-color-scheme (web)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('returns light before hydration', () => {
    const useStateMock = jest.fn(() => [false, jest.fn()]);
    const useEffectMock = jest.fn(() => undefined);
    const rnUseColorScheme = jest.fn(() => 'dark');

    jest.doMock('react', () => {
      const actual = jest.requireActual('react');
      return {
        ...actual,
        useState: useStateMock,
        useEffect: useEffectMock,
      };
    });

    jest.doMock('react-native', () => ({
      useColorScheme: rnUseColorScheme,
    }));

    const { useColorScheme } = require('@/hooks/use-color-scheme.web');

    expect(useColorScheme()).toBe('light');
    expect(rnUseColorScheme).toHaveBeenCalled();
  });

  it('returns react-native color scheme after hydration', () => {
    const useStateMock = jest.fn(() => [true, jest.fn()]);
    const useEffectMock = jest.fn(() => undefined);
    const rnUseColorScheme = jest.fn(() => 'dark');

    jest.doMock('react', () => {
      const actual = jest.requireActual('react');
      return {
        ...actual,
        useState: useStateMock,
        useEffect: useEffectMock,
      };
    });

    jest.doMock('react-native', () => ({
      useColorScheme: rnUseColorScheme,
    }));

    const { useColorScheme } = require('@/hooks/use-color-scheme.web');

    expect(useColorScheme()).toBe('dark');
    expect(rnUseColorScheme).toHaveBeenCalled();
  });
});
