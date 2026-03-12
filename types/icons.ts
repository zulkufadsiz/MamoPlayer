// TODO: These root-level types are app-level helpers used by the demo app and
// constants/. They are NOT re-exported by any published package. Keep in sync with
// packages/pro/src/types/icons.ts, or consolidate once the app shell stabilises.
import type React from 'react';

export interface PlayerIconSet {
  Play?: React.ComponentType<any>;
  Pause?: React.ComponentType<any>;
  Fullscreen?: React.ComponentType<any>;
  ExitFullscreen?: React.ComponentType<any>;
  PictureInPicture?: React.ComponentType<any>;
  VolumeOn?: React.ComponentType<any>;
  VolumeOff?: React.ComponentType<any>;
  Settings?: React.ComponentType<any>;
}
