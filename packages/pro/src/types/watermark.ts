/** Configuration for the text watermark overlay rendered on top of the video. */
export interface WatermarkConfig {
  /** Watermark text content (e.g. a username or licence identifier). */
  text: string;
  /** Opacity of the watermark text from `0` (invisible) to `1` (fully opaque). Defaults to `0.3`. */
  opacity?: number;
  /** Move the watermark to a random position each interval to deter screen recording. Defaults to `false`. */
  randomizePosition?: boolean;
  /** Milliseconds between position changes when `randomizePosition` is `true`. Defaults to `5000`. */
  intervalMs?: number;
}
