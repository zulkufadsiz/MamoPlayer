export interface DrmConfig {
  /** DRM scheme to use. Use 'widevine' for Android/DASH, 'fairplay' for iOS/HLS. */
  type: 'widevine' | 'fairplay';
  /** URL of the license acquisition server. */
  licenseServer: string;
  /** Optional HTTP headers to include in license requests. */
  headers?: Record<string, string>;
}
