type BridgeModule = typeof import('./nativeBridge');

interface BridgeMocks {
  bridge: BridgeModule;
  nativeModule: {
    loadAds: jest.Mock<Promise<void>, [string]>;
    startAds: jest.Mock<Promise<void>, []>;
    stopAds: jest.Mock<Promise<void>, []>;
    releaseAds: jest.Mock<Promise<void>, []>;
    addListener: jest.Mock<void, [string]>;
    removeListeners: jest.Mock<void, [number]>;
  };
  eventEmitterCtor: jest.Mock;
  addListener: jest.Mock;
  listeners: Record<string, (payload?: unknown) => void>;
  removeSpies: jest.Mock[];
}

const setupBridge = (withModule = true): BridgeMocks => {
  jest.resetModules();

  const listeners: Record<string, (payload?: unknown) => void> = {};
  const removeSpies: jest.Mock[] = [];

  const addListener = jest.fn((eventName: string, callback: (payload?: unknown) => void) => {
    listeners[eventName] = callback;
    const remove = jest.fn();
    removeSpies.push(remove);
    return { remove };
  });

  const nativeModule = {
    loadAds: jest.fn(async (_adTagUrl: string) => {}),
    startAds: jest.fn(async () => {}),
    stopAds: jest.fn(async () => {}),
    releaseAds: jest.fn(async () => {}),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  const eventEmitterCtor = jest.fn(() => ({
    addListener,
  }));

  jest.doMock('react-native', () => ({
    NativeModules: withModule ? { MamoAdsModule: nativeModule } : {},
    NativeEventEmitter: eventEmitterCtor,
  }));

  let bridge!: BridgeModule;
  jest.isolateModules(() => {
    bridge = require('./nativeBridge') as BridgeModule;
  });

  return {
    bridge,
    nativeModule,
    eventEmitterCtor,
    addListener,
    listeners,
    removeSpies,
  };
};

describe('ima nativeBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards bridge methods to MamoAdsModule', async () => {
    const { bridge, nativeModule } = setupBridge();

    await bridge.loadAds('https://example.com/adtag');
    await bridge.startAds();
    await bridge.stopAds();
    await bridge.releaseAds();

    expect(nativeModule.loadAds).toHaveBeenCalledWith('https://example.com/adtag');
    expect(nativeModule.startAds).toHaveBeenCalledTimes(1);
    expect(nativeModule.stopAds).toHaveBeenCalledTimes(1);
    expect(nativeModule.releaseAds).toHaveBeenCalledTimes(1);
  });

  it('subscribes to all mamo ads events and unsubscribes cleanly', () => {
    const { bridge, nativeModule, eventEmitterCtor, addListener, listeners, removeSpies } =
      setupBridge();
    const handler = jest.fn();

    const unsubscribe = bridge.subscribeToAdsEvents(handler);

    expect(eventEmitterCtor).toHaveBeenCalledWith(nativeModule);
    expect(addListener).toHaveBeenCalledTimes(4);
    expect(addListener.mock.calls.map(([eventName]) => eventName)).toEqual([
      'mamo_ads_loaded',
      'mamo_ads_started',
      'mamo_ads_completed',
      'mamo_ads_error',
    ]);

    listeners.mamo_ads_loaded({ loaded: true });
    listeners.mamo_ads_started({ started: true });
    listeners.mamo_ads_completed({ completed: true });
    listeners.mamo_ads_error({ message: 'failure' });

    expect(handler.mock.calls).toEqual([
      ['mamo_ads_loaded', { loaded: true }],
      ['mamo_ads_started', { started: true }],
      ['mamo_ads_completed', { completed: true }],
      ['mamo_ads_error', { message: 'failure' }],
    ]);

    unsubscribe();

    expect(removeSpies).toHaveLength(4);
    removeSpies.forEach((remove) => {
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });

  it('throws a clear error when MamoAdsModule is unavailable', async () => {
    const { bridge } = setupBridge(false);

    await expect(bridge.loadAds('https://example.com/adtag')).rejects.toThrow(
      'MamoAdsModule native module is not available.',
    );
    expect(() => bridge.subscribeToAdsEvents(jest.fn())).toThrow(
      'MamoAdsModule native module is not available.',
    );
  });
});
