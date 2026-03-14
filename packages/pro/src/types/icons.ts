import type React from 'react';

/**
 * Custom icon component overrides.
 *
 * Each key maps to a slot in the player UI. Provide any React component that
 * accepts at minimum `{ size?: number; color?: string }` props. Omitted slots
 * fall back to the default Material icon set.
 */
export interface PlayerIconSet {
  /** Icon shown in the play button when the player is paused. */
  Play?: React.ComponentType<any>;
  /** Icon shown in the play button when the player is playing. */
  Pause?: React.ComponentType<any>;
  /** Icon shown in the fullscreen toggle when not in fullscreen. */
  Fullscreen?: React.ComponentType<any>;
  /** Icon shown in the fullscreen toggle when in fullscreen. */
  ExitFullscreen?: React.ComponentType<any>;
  /** Icon shown in the picture-in-picture button. */
  PictureInPicture?: React.ComponentType<any>;
  /** Icon shown when audio is on. */
  VolumeOn?: React.ComponentType<any>;
  /** Icon shown when audio is muted. */
  VolumeOff?: React.ComponentType<any>;
  /** Icon shown in the settings (gear) button. */
  Settings?: React.ComponentType<any>;
}
