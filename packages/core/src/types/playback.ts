/** Whether the source is a remote stream or a local/offline file. */
export type PlaybackSourceType = 'streaming' | 'offline';

/**
 * Discriminant for every `PlaybackEvent`.
 *
 * | Value          | Meaning |
 * |----------------|---------|
 * | `ready`        | Media metadata loaded; playback can begin. |
 * | `play`         | Playback started or resumed. |
 * | `pause`        | Playback paused. |
 * | `ended`        | Playback reached the end of the media. |
 * | `buffer_start` | Player stalled waiting for data. |
 * | `buffer_end`   | Buffering complete; playback resumed. |
 * | `seek`         | A seek operation completed. |
 * | `time_update`  | Periodic position update (approx. every 250 ms). |
 * | `source_type`  | Source type (`streaming` / `offline`) resolved. |
 * | `error`        | A playback error occurred. |
 */
export type PlaybackEventType =
  | 'ready'
  | 'play'
  | 'pause'
  | 'ended'
  | 'buffer_start'
  | 'buffer_end'
  | 'seek'
  | 'time_update'
  | 'source_type'
  | 'error';

/** Common fields present on every playback event. */
export type PlaybackEventBase = {
  /** Identifies the kind of event. */
  type: PlaybackEventType;
  /** Unix timestamp (ms) at which the event was fired. */
  timestamp: number;
};

/** Position and duration snapshot captured at the moment of an event. */
export type PlaybackTimePayload = {
  /** Current playback position in seconds. */
  position: number;
  /** Total media duration in seconds, if already known. */
  duration?: number;
};

/**
 * Rich playback lifecycle event emitted via `MamoPlayerProps.onPlaybackEvent`.
 *
 * Combines `PlaybackEventBase` + `PlaybackTimePayload` with optional
 * contextual fields that are only set for relevant event types.
 */
export type PlaybackEvent = PlaybackEventBase &
  PlaybackTimePayload & {
    /** What triggered this event. Present on `play`, `pause`, and `seek`. */
    reason?: 'user' | 'auto' | 'programmatic';
    /** Resolved source locality. Present on `source_type`. */
    sourceType?: PlaybackSourceType;
    /** Error details. Present on `error`. */
    error?: {
      message: string;
      code?: string | number;
    };
  };
