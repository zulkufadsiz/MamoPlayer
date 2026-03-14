/** A single ad media source. */
export interface AdSource {
  /** URL of the ad media file. */
  uri: string;
  /** MIME type of the ad media. Defaults to `'video/mp4'`. */
  type?: 'video/mp4' | 'application/x-mpegURL';
}

/** Defines a single ad break within the content timeline. */
export interface AdBreak {
  /** Position of the ad break: `'preroll'` before content, `'midroll'` at a specific time, `'postroll'` after content ends. */
  type: 'preroll' | 'midroll' | 'postroll';
  /** Offset in seconds from the start of the content. Required for `midroll` breaks; ignored otherwise. */
  time?: number;
  /** The ad media source to play. */
  source: AdSource;
}

/** Configuration for the custom (non-IMA) ad system. Mutually exclusive with `IMAConfig`. */
export interface AdsConfig {
  /** Ordered list of ad breaks to schedule. */
  adBreaks: AdBreak[];
  /** Show a skip button after `skipAfterSeconds`. Defaults to `false`. */
  skipButtonEnabled?: boolean;
  /** Seconds after which the skip button becomes active. Only relevant when `skipButtonEnabled` is `true`. */
  skipAfterSeconds?: number;
  /** Pixel insets for the skip/countdown ad overlay (e.g. to avoid notches or PiP areas). */
  overlayInset?: {
    /** Right inset in pixels. */
    right?: number;
    /** Bottom inset in pixels. */
    bottom?: number;
  };
}

/** Convenience alias for the `AdBreak.type` discriminant. */
export type AdBreakType = AdBreak['type'];
