export interface PlaybackRestrictions {
  disableSeekingForward?: boolean;
  disableSeekingBackward?: boolean;
  maxPlaybackRate?: number; // e.g. 1.5 to limit speed
}
