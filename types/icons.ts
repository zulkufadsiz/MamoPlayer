import type React from 'react';

export interface PlayerIconSet {
  Play?: React.ComponentType<any>;
  Pause?: React.ComponentType<any>;
  Fullscreen?: React.ComponentType<any>;
  ExitFullscreen?: React.ComponentType<any>;
  VolumeOn?: React.ComponentType<any>;
  VolumeOff?: React.ComponentType<any>;
  Settings?: React.ComponentType<any>;
}
