/** An external subtitle / closed-caption track. */
export type SubtitleTrack = {
  /** Unique identifier used to select this track. */
  id: string;
  /** BCP 47 language tag (e.g. `'en'`, `'fr'`). */
  language: string;
  /** Human-readable label shown in the settings menu. */
  label: string;
  /** URL of the WebVTT subtitle file. */
  uri: string;
  /** Select this track by default when no `defaultSubtitleTrackId` is set. */
  isDefault?: boolean;
};

/** An audio track available in the media stream. */
export type AudioTrack = {
  /** Unique identifier used to select this track. */
  id: string;
  /** BCP 47 language tag (e.g. `'en'`, `'es'`). */
  language: string;
  /** Human-readable label shown in the settings menu. */
  label: string;
};

/**
 * Canonical quality tier identifier.
 *
 * Use `'auto'` to let the player perform adaptive bitrate (ABR) selection.
 */
export type VideoQualityId =
  | 'auto'
  | '144p'
  | '240p'
  | '360p'
  | '480p'
  | '720p'
  | '1080p'
  | '1440p'
  | '2160p';

/** A discrete quality variant (multi-bitrate rendition) of the video. */
export type QualityVariant = {
  /** Identifies the quality level. Must be unique within `TracksConfig.qualities`. */
  id: VideoQualityId;
  /** Human-readable label shown in the quality picker (e.g. `'1080p HD'`). */
  label: string;
  /** URL of the HLS/DASH manifest or MP4 file for this rendition. */
  uri: string;
  /** Select this variant by default when no `defaultQualityId` is set. */
  isDefault?: boolean;
};

/** Override or supplement the tracks available in the media manifest. */
export type TracksConfig = {
  /** Discrete quality variants offered to the user in the quality picker. */
  qualities?: QualityVariant[];
  /** Audio tracks offered to the user in the audio-track picker. */
  audioTracks?: AudioTrack[];
  /** External subtitle tracks offered to the user in the subtitle picker. */
  subtitleTracks?: SubtitleTrack[];
  /** ID of the quality variant to activate on first load. Defaults to `'auto'`. */
  defaultQualityId?: VideoQualityId;
  /** ID of the audio track to activate on first load. `null` uses the manifest default. */
  defaultAudioTrackId?: string | null;
  /** ID of the subtitle track to activate on first load. `'off'` disables subtitles. `null` uses the manifest default. */
  defaultSubtitleTrackId?: string | 'off' | null;
};
