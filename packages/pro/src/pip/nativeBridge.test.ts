type BridgeModule = typeof import('./nativeBridge');

interface BridgeMocks {
  bridge: BridgeModule;
  nativeModule: {
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
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  const eventEmitterCtor = jest.fn(() => ({
    addListener,
  }));

  jest.doMock('react-native', () => ({
    NativeModules: withModule ? { MamoPipModule: nativeModule } : {},
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

describe('pip nativeBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes to native PiP events and unsubscribes cleanly', () => {
    const { bridge, nativeModule, eventEmitterCtor, addListener, listeners, removeSpies } =
      setupBridge();
    const handler = jest.fn();

    const unsubscribe = bridge.subscribeToPipEvents(handler);

    expect(eventEmitterCtor).toHaveBeenCalledWith(nativeModule);
    expect(addListener).toHaveBeenCalledTimes(2);
    expect(addListener.mock.calls.map(([eventName]) => eventName)).toEqual([
      'mamo_pip_active',
      'mamo_pip_exiting',
    ]);

    listeners.mamo_pip_active({ active: true });
    listeners.mamo_pip_exiting({ exiting: true });

    expect(handler.mock.calls).toEqual([
      ['mamo_pip_active', { active: true }],
      ['mamo_pip_exiting', { exiting: true }],
    ]);

    unsubscribe();

    expect(removeSpies).toHaveLength(2);
    removeSpies.forEach((remove) => {
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });

  it('throws a clear error when MamoPipModule is unavailable', () => {
    const { bridge } = setupBridge(false);

    expect(() => bridge.subscribeToPipEvents(jest.fn())).toThrow(
      'MamoPipModule native module is not available.',
    );
  });
});
