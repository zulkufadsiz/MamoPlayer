/** A single thumbnail frame extracted from the video timeline. */
export interface ThumbnailFrame {
  /** Position in seconds that this thumbnail represents. */
  time: number;
  /** URI of the thumbnail image (local file or remote URL). */
  uri: string;
}

/**
 * Configuration for the scrubber thumbnail preview feature.
 *
 * Provide an array of pre-generated frames (e.g. from a sprite sheet pipeline);
 * `ProMamoPlayer` will automatically display the closest frame while the user
 * drags the timeline scrubber.
 */
export interface ThumbnailsConfig {
  /** Ordered (ascending by `time`) array of thumbnail frames covering the video duration. */
  frames: ThumbnailFrame[];
}
