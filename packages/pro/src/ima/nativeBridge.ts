import {
    NativeEventEmitter,
    NativeModules,
    type EmitterSubscription,
    type NativeModule,
} from 'react-native';

type MamoAdsEventName =
  | 'mamo_ads_loaded'
  | 'mamo_ads_started'
  | 'mamo_ads_completed'
  | 'mamo_ads_error';

interface MamoAdsNativeModule extends NativeModule {
  loadAds(adTagUrl: string): Promise<void>;
  startAds(): Promise<void>;
  stopAds(): Promise<void>;
  releaseAds(): Promise<void>;
}

type MamoAdsEventsHandler = (eventName: MamoAdsEventName, payload?: unknown) => void;

const MAMO_ADS_MODULE_NAME = 'MamoAdsModule';

const mamoAdsModule = NativeModules[MAMO_ADS_MODULE_NAME] as MamoAdsNativeModule | undefined;

const getAdsModule = (): MamoAdsNativeModule => {
  if (!mamoAdsModule) {
    throw new Error(`${MAMO_ADS_MODULE_NAME} native module is not available.`);
  }

  return mamoAdsModule;
};

const getAdsEventEmitter = (): NativeEventEmitter => {
  return new NativeEventEmitter(getAdsModule());
};

export const loadAds = async (adTagUrl: string): Promise<void> => {
  return getAdsModule().loadAds(adTagUrl);
};

export const startAds = async (): Promise<void> => {
  return getAdsModule().startAds();
};

export const stopAds = async (): Promise<void> => {
  return getAdsModule().stopAds();
};

export const releaseAds = async (): Promise<void> => {
  return getAdsModule().releaseAds();
};

export const subscribeToAdsEvents = (handler: MamoAdsEventsHandler): (() => void) => {
  const eventEmitter = getAdsEventEmitter();

  const subscriptions: EmitterSubscription[] = [
    eventEmitter.addListener('mamo_ads_loaded', (payload?: unknown) => {
      handler('mamo_ads_loaded', payload);
    }),
    eventEmitter.addListener('mamo_ads_started', (payload?: unknown) => {
      handler('mamo_ads_started', payload);
    }),
    eventEmitter.addListener('mamo_ads_completed', (payload?: unknown) => {
      handler('mamo_ads_completed', payload);
    }),
    eventEmitter.addListener('mamo_ads_error', (payload?: unknown) => {
      handler('mamo_ads_error', payload);
    }),
  ];

  return () => {
    subscriptions.forEach((subscription) => subscription.remove());
  };
};

export type { MamoAdsEventName, MamoAdsEventsHandler };
