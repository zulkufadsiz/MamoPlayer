import {
  NativeEventEmitter,
  NativeModules,
  type EmitterSubscription,
  type NativeModule,
} from 'react-native';

import type { CastState } from '../types/casting';

interface MamoCastNativeModule extends NativeModule {
  /** Required by React Native's NativeEventEmitter contract. */
  addListener(eventType: string): void;
  /** Required by React Native's NativeEventEmitter contract. */
  removeListeners(count: number): void;
  /** Show the platform-native cast device picker (AirPlay sheet on iOS, MediaRouteChooser on Android). */
  showCastPicker(): void;
  /** Resolve with the current cast session state. */
  getCastState(): Promise<CastState>;
}

const MAMO_CAST_MODULE_NAME = 'MamoCastModule';

const mamoCastModule = NativeModules[MAMO_CAST_MODULE_NAME] as MamoCastNativeModule | undefined;

/** Returns true when the MamoCastModule native module is registered in the host app. */
export const isCastNativeAvailable = (): boolean => Boolean(mamoCastModule);

const getCastModule = (): MamoCastNativeModule => {
  if (!mamoCastModule) {
    throw new Error(
      `${MAMO_CAST_MODULE_NAME} native module is not available. ` +
        'Ensure the module is registered in MainApplication (Android) / AppDelegate (iOS).',
    );
  }
  return mamoCastModule;
};

/**
 * Open the platform cast-device picker.
 * - iOS  → AVRoutePickerView AirPlay sheet
 * - Android → MediaRouteChooserDialog (Google Cast)
 *
 * No-ops when the native module is not available.
 */
export const showCastPicker = (): void => {
  if (!isCastNativeAvailable()) return;
  getCastModule().showCastPicker();
};

/**
 * Fetch the current cast session state from the native layer.
 * Returns `'unavailable'` when the native module is not registered.
 */
export const getCastState = async (): Promise<CastState> => {
  if (!isCastNativeAvailable()) return 'unavailable';
  try {
    return await getCastModule().getCastState();
  } catch {
    return 'idle';
  }
};

/**
 * Subscribe to cast-state change events emitted by the native module.
 * Returns an unsubscribe function.  Immediately returns a no-op unsubscribe
 * when the native module is not available.
 */
export const subscribeToCastEvents = (handler: (state: CastState) => void): (() => void) => {
  if (!isCastNativeAvailable()) return () => {};

  const emitter = new NativeEventEmitter(getCastModule());
  const subscription: EmitterSubscription = emitter.addListener(
    'mamo_cast_state_changed',
    (payload: { state: CastState }) => {
      handler(payload.state);
    },
  );

  return () => subscription.remove();
};
