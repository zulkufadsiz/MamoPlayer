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
  requestPictureInPicture?: () => void;
  enterPictureInPicture?: () => void;
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

export const requestPictureInPicture = (): void => {
  if (!mamoPipModule) {
    if (__DEV__) {
      console.warn(`[MamoPlayer] ${MAMO_PIP_MODULE_NAME} native module is not available. Cannot enter PiP.`);
    }
    return;
  }

  const pipModule = getPipModule();

  if (typeof pipModule.requestPictureInPicture === 'function') {
    pipModule.requestPictureInPicture();
    return;
  }

  if (typeof pipModule.enterPictureInPicture === 'function') {
    pipModule.enterPictureInPicture();
    return;
  }

  throw new Error(
    `${MAMO_PIP_MODULE_NAME} does not expose requestPictureInPicture or enterPictureInPicture.`,
  );
};

export const subscribeToPipEvents = (handler: MamoPipEventsHandler): (() => void) => {
  if (!mamoPipModule) {
    if (__DEV__) {
      console.warn(`[MamoPlayer] ${MAMO_PIP_MODULE_NAME} native module is not available. PiP events will not be received.`);
    }
    return () => {};
  }

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
