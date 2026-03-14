/** Playback restriction rules enforced by the player UI (e.g. for content with scrubbing disabled). */
export interface PlaybackRestrictions {
  /** Prevent the user from seeking forward (e.g. for live content or forced ad watches). */
  disableSeekingForward?: boolean;
  /** Prevent the user from seeking backward. */
  disableSeekingBackward?: boolean;
  /** Maximum playback rate the user can select (e.g. `1.5` to cap at 1.5× speed). */
  maxPlaybackRate?: number;
}
