/**
 * Configuration for Google IMA SDK-based ad integration.
 *
 * When `enabled` is `true` and `adTagUrl` is provided, ProMamoPlayer hands
 * ad scheduling to the native MamoAdsModule (Google IMA on both platforms).
 * Mutually exclusive with the custom `AdsConfig` system.
 */
export interface IMAConfig {
  /** Activate IMA ad playback. When `false` the `adTagUrl` is ignored. */
  enabled: boolean;
  /** VAST/VMAP ad tag URL served by your ad server (e.g. Google Ad Manager). */
  adTagUrl: string;
}
