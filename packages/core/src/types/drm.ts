/**
 * DRM (Digital Rights Management) configuration for encrypted streams.
 *
 * Use `'widevine'` for DASH streams on Android and `'fairplay'` for HLS on iOS.
 */
export interface DrmConfig {
  /** DRM scheme to use. Use `'widevine'` for Android/DASH, `'fairplay'` for iOS/HLS. */
  type: 'widevine' | 'fairplay';
  /** URL of the license acquisition server. */
  licenseServer: string;
  /** Optional HTTP headers to include with every license request (e.g. `Authorization`). */
  headers?: Record<string, string>;
}
