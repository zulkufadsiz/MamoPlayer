export { PlaybackOptions } from './components/PlaybackOptions';

export type { PlaybackOptionsProps } from './components/PlaybackOptions';
export { Timeline } from './components/Timeline';
export type { TimelineProps } from './components/Timeline';
export {
    MamoPlayerCore as MamoPlayer,
    MamoPlayerCore,
    type MamoPlayerCoreProps,
    type MamoPlayerCoreProps as MamoPlayerProps,
    type MamoPlayerSource
} from './MamoPlayer';
export type {
    PlaybackEvent,
    PlaybackEventBase,
    PlaybackEventType,
    PlaybackTimePayload
} from './types/playback';
export type {
    SettingsOverlayConfig,
    SettingsOverlayExtraMenuItem,
    SettingsOverlayExtraMenuOption
} from './types/settings';

export { default } from './MamoPlayer';
