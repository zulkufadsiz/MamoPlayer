import {
  NativeEventEmitter,
  NativeModules,
  type EmitterSubscription,
  type NativeModule,
} from 'react-native';

type MamoPipEventName = 'mamo_pip_active' | 'mamo_pip_exiting';

interface MamoPipNativeModule extends NativeModule {
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

type MamoPipEventsHandler = (eventName: MamoPipEventName, payload?: unknown) => void;

const MAMO_PIP_MODULE_NAME = 'MamoPipModule';

const mamoPipModule = NativeModules[MAMO_PIP_MODULE_NAME] as MamoPipNativeModule | undefined;

const getPipModule = (): MamoPipNativeModule => {
  if (!mamoPipModule) {
    throw new Error(`${MAMO_PIP_MODULE_NAME} native module is not available.`);
  }

  return mamoPipModule;
};

const getPipEventEmitter = (): NativeEventEmitter => {
  return new NativeEventEmitter(getPipModule());
};

export const subscribeToPipEvents = (handler: MamoPipEventsHandler): (() => void) => {
  const eventEmitter = getPipEventEmitter();

  const subscriptions: EmitterSubscription[] = [
    eventEmitter.addListener('mamo_pip_active', (payload?: unknown) => {
      handler('mamo_pip_active', payload);
    }),
    eventEmitter.addListener('mamo_pip_exiting', (payload?: unknown) => {
      handler('mamo_pip_exiting', payload);
    }),
  ];

  return () => {
    subscriptions.forEach((subscription) => subscription.remove());
  };
};

export type { MamoPipEventName, MamoPipEventsHandler };
