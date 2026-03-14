/**
 * Configuration for casting support (Chromecast on Android, AirPlay on iOS).
 *
 * Requires native module setup:
 *  - iOS: MamoCastModule registered in AppDelegate / bridging header (handles AirPlay via AVRoutePickerView).
 *  - Android: MamoCastPackage registered in MainApplication; Google Cast SDK dependency added to build.gradle.
 */
export interface CastingConfig {
  /**
   * Enable the cast button in playback controls.
   * When true, a cast icon appears in the top-right controls bar.
   * @default false
   */
  enabled?: boolean;
}

/**
 * Reflects the current state of a cast session.
 *
 * - `unavailable`  — No cast devices found, or the native Cast SDK is not available.
 * - `idle`         — Cast devices are available but no active session.
 * - `connecting`   — A connection to a cast device is in progress.
 * - `connected`    — Actively casting to a remote device.
 */
export type CastState = 'unavailable' | 'idle' | 'connecting' | 'connected';
