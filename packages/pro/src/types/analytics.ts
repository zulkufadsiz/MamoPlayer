import type { PlaybackEvent } from '@mamoplayer/core';

/**
 * Discriminant for every `AnalyticsEvent`.
 *
 * Ad lifecycle: `ad_start`, `ad_complete`, `ad_error`.
 * Session lifecycle: `session_start`, `session_end`.
 * Playback: `play`, `pause`, `ended`, `buffer_start`, `buffer_end`, `seek`, `quartile`.
 * Track changes: `quality_change`, `subtitle_change`, `audio_track_change`.
 * Errors: `buffering_start`, `buffering_end`, `playback_error`.
 */
export type AnalyticsEventType =
  | 'ad_start'
  | 'ad_complete'
  | 'ad_error'
  | 'session_start'
  | 'session_end'
  | 'play'
  | 'pause'
  | 'ended'
  | 'buffer_start'
  | 'buffer_end'
  | 'seek'
  | 'quartile'
  | 'quality_change'
  | 'subtitle_change'
  | 'audio_track_change'
  | 'buffering_start'
  | 'buffering_end'
  | 'playback_error';

/** Common fields shared by every analytics event. */
export interface AnalyticsEventBase {
  /** Identifies the kind of event. */
  type: AnalyticsEventType;
  /** Unix timestamp (ms) when the event was fired. */
  timestamp: number;
}

/**
 * Rich analytics event delivered to `AnalyticsConfig.onEvent`.
 *
 * Optional fields are only populated when relevant to the event type.
 */
export interface AnalyticsEvent extends AnalyticsEventBase {
  /** Playback position in seconds at the time of the event. */
  position: number;
  /** Total media duration in seconds, if known. */
  duration?: number;
  /** The originating `PlaybackEvent` from the core player, if applicable. */
  playbackEvent?: PlaybackEvent;
  /** Percentage milestone reached (present on `quartile`). */
  quartile?: 25 | 50 | 75 | 100;
  /** IMA ad tag URL that triggered this event (present on IMA ad events). */
  adTagUrl?: string;
  /** Position of the ad break in the timeline (present on ad events). */
  adPosition?: 'preroll' | 'midroll' | 'postroll';
  /** Human-readable error description (present on `ad_error` and `playback_error`). */
  errorMessage?: string;
  /** Main content position in seconds at the moment the ad started (present on `ad_start`). */
  mainContentPositionAtAdStart?: number;
  /** Session ID from `AnalyticsConfig.sessionId`, forwarded on every event. */
  sessionId?: string;
  /** ID of the audio track that was selected (present on `audio_track_change`). */
  audioTrackId?: string;
  /** Quality variant label selected by the user (present on `quality_change`). */
  selectedQuality?: string;
  /** Subtitle track label selected (present on `subtitle_change`). */
  selectedSubtitle?: string;
  /** Audio track label selected (present on `audio_track_change`). */
  selectedAudioTrack?: string;
}

/** Configuration to wire up analytics reporting. */
export interface AnalyticsConfig {
  /** Called for every analytics event. Use this to forward events to your analytics backend. */
  onEvent: (event: AnalyticsEvent) => void;
  /** Optional session identifier attached to every event for cross-event correlation. */
  sessionId?: string;
}
