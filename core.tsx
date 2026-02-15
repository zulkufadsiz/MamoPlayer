import React from 'react';
import {
  MamoPlayer,
  type MamoPlayerProps,
  type Subtitle,
  type SubtitleTrack,
} from './components/MamoPlayer';

export { SimplePlayer } from './components/SimplePlayer';
export type { SimplePlayerProps } from './components/SimplePlayer';
export type { MamoPlayerProps, Subtitle, SubtitleTrack };

export type MamoPlayerCoreProps = Omit<MamoPlayerProps, 'playerType'>;

export const MamoPlayerCore: React.FC<MamoPlayerCoreProps> = (props) => {
  return <MamoPlayer {...props} playerType="simple" />;
};
