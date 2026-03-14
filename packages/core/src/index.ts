export { PlaybackOptions } from './components/PlaybackOptions';

export type { PlaybackOptionsProps } from './components/PlaybackOptions';
export { Timeline } from './components/Timeline';
export type { TimelineProps } from './components/Timeline';
export {
    MamoPlayerCore as MamoPlayer,
    MamoPlayerCore,
    type ControlsConfig,
    type DebugConfig,
    type GesturesConfig,
    type MamoPlayerCoreProps,
    type MamoPlayerCoreProps as MamoPlayerProps,
    type MamoPlayerSource
} from './MamoPlayer';
export type { CastState, CastingConfig } from './types/casting';
export type { DrmConfig } from './types/drm';
export type {
    PlaybackEvent,
    PlaybackEventBase,
    PlaybackEventType,
    PlaybackSourceType,
    PlaybackTimePayload
} from './types/playback';
export type {
    SettingsOverlayConfig,
    SettingsOverlayExtraMenuItem,
    SettingsOverlayExtraMenuOption
} from './types/settings';
export { detectSourceType } from './utils/source';

export { default } from './MamoPlayer';
