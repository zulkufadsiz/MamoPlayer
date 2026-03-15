import type React from 'react';
import type { ReactVideoProps, VideoRef } from 'react-native-video';

/**
 * Source type accepted by the adapter. Mirrors the `source` prop shape
 * accepted by `react-native-video` so callers never need to import from the
 * engine directly.
 */
export type VideoAdapterSource = NonNullable<ReactVideoProps['source']>;

/**
 * Callbacks used by the adapter to propagate state changes that
 * `react-native-video` manages through React props rather than an imperative
 * API.
 *
 * The host component should update its own state when these fire and
 * re-render the `<Video>` element with the new prop value.
 */
export interface ReactNativeVideoAdapterCallbacks {
  /**
   * Called when the adapter wants to change the muted state.
   *
   * The host should update its `muted` state and pass it to `<Video muted={…}>`.
   */
  onMutedChange?: (muted: boolean) => void;

  /**
   * Called when the adapter wants to change the playback rate.
   *
   * The host should update its `rate` state and pass it to `<Video rate={…}>`.
   */
  onPlaybackRateChange?: (rate: number) => void;

  /**
   * Called when the adapter wants to swap the video source.
   *
   * The host should update its `source` state and pass it to `<Video source={…}>`.
   */
  onSourceChange?: (source: VideoAdapterSource) => void;
}

/**
 * Lightweight adapter that centralises all direct interactions with the
 * underlying `react-native-video` `VideoRef`.
 *
 * UI components and controllers should call through this adapter rather than
 * reaching into `videoRef` directly. This creates a clear seam for:
 * - Future engine swaps (e.g. ExoPlayer bindings, AVPlayer command API)
 * - Instrumentation and logging without touching call sites
 * - Unit-testing player behaviour without a real native player
 *
 * ## Prop-driven operations
 *
 * `react-native-video` manages muted state, playback rate, and source through
 * React props rather than an imperative API. For those operations,
 * the adapter delegates to the `callbacks` passed at construction time so the
 * host component can propagate the change via a re-render.
 *
 * @example
 * ```tsx
 * const adapter = new ReactNativeVideoAdapter(videoRef, {
 *   onMutedChange: setIsMuted,
 *   onPlaybackRateChange: setPlaybackRate,
 *   onSourceChange: setSource,
 * });
 *
 * adapter.play();
 * adapter.seekTo(30);
 * adapter.setMuted(true);
 * ```
 */
export class ReactNativeVideoAdapter {
  private readonly videoRef: React.RefObject<VideoRef | null>;
  private readonly callbacks: ReactNativeVideoAdapterCallbacks;

  constructor(
    videoRef: React.RefObject<VideoRef | null>,
    callbacks: ReactNativeVideoAdapterCallbacks = {},
  ) {
    this.videoRef = videoRef;
    this.callbacks = callbacks;
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  /**
   * Resume playback.
   *
   * Delegates to `VideoRef.resume()`.
   */
  play(): void {
    this.videoRef.current?.resume();
  }

  /**
   * Pause playback.
   *
   * Delegates to `VideoRef.pause()`.
   */
  pause(): void {
    this.videoRef.current?.pause();
  }

  /**
   * Seek to an absolute position in seconds.
   *
   * Delegates to `VideoRef.seek()`.
   */
  seekTo(time: number): void {
    this.videoRef.current?.seek(time);
  }

  // ─── Audio ─────────────────────────────────────────────────────────────────

  /**
   * Mute or unmute audio output.
   *
   * `react-native-video` controls muted state through the `muted` prop rather
   * than an imperative API. This method notifies the host via
   * `onMutedChange` so the prop can be updated on the next render.
   *
   * TODO: Replace with a direct imperative call once a more capable engine is
   *       adopted (e.g. AVPlayer `player.isMuted`, ExoPlayer `setVolume(0)`).
   */
  setMuted(muted: boolean): void {
    this.callbacks.onMutedChange?.(muted);
  }

  // ─── Playback rate ─────────────────────────────────────────────────────────

  /**
   * Change the playback speed multiplier (e.g. `1.0`, `1.5`, `2.0`).
   *
   * `react-native-video` controls the rate through the `rate` prop rather than
   * an imperative API. This method notifies the host via
   * `onPlaybackRateChange` so the prop can be updated on the next render.
   *
   * TODO: Replace with a direct imperative call once a more capable engine is
   *       adopted.
   */
  setPlaybackRate(rate: number): void {
    this.callbacks.onPlaybackRateChange?.(rate);
  }

  // ─── Source ───────────────────────────────────────────────────────────────

  /**
   * Swap the active video source.
   *
   * Delegates to the host via `onSourceChange` so the `source` prop on the
   * `<Video>` element is updated through React state.
   *
   * TODO: DRM – attach licence server URL and request headers to the source
   *       object before forwarding it to the engine. Once a `DrmConfig` type
   *       is formalised here, callers should pass DRM details through this
   *       method rather than embedding them in the source object manually.
   *
   * TODO: Pre-buffering / pre-loading – when the engine supports it, send a
   *       warm-up hint so the next source begins buffering before `setSource`
   *       is called (e.g. gapless ad insertion, next-episode preloading).
   */
  setSource(source: VideoAdapterSource): void {
    this.callbacks.onSourceChange?.(source);
  }

  // ─── Fullscreen ───────────────────────────────────────────────────────────

  /**
   * Request native fullscreen presentation.
   *
   * - iOS: delegates to `VideoRef.presentFullscreenPlayer()`.
   * - Android: delegates to `VideoRef.setFullScreen(true)`.
   *
   * Note: MamoPlayer's default fullscreen experience is implemented as a
   * React `<Modal>` driven by `isFullscreen` state in the controller. Call
   * this method when you need the engine-level native fullscreen instead
   * (e.g. AirPlay, system picture-in-picture transition).
   *
   * TODO: Unify cross-platform fullscreen behind a single engine-level API
   *       to hide the iOS / Android divergence from call sites.
   */
  enterFullscreen(): void {
    this.videoRef.current?.presentFullscreenPlayer?.();
    this.videoRef.current?.setFullScreen?.(true);
  }

  /**
   * Dismiss native fullscreen presentation.
   *
   * - iOS: delegates to `VideoRef.dismissFullscreenPlayer()`.
   * - Android: delegates to `VideoRef.setFullScreen(false)`.
   *
   * TODO: Unify cross-platform fullscreen behind a single engine-level API
   *       to hide the iOS / Android divergence from call sites.
   */
  exitFullscreen(): void {
    this.videoRef.current?.dismissFullscreenPlayer?.();
    this.videoRef.current?.setFullScreen?.(false);
  }

  // ─── Future capabilities ──────────────────────────────────────────────────

  // TODO: DRM – add a `configureDrm(config: DrmConfig)` method to centralise
  //       Widevine / FairPlay / PlayReady licence acquisition, key renewal,
  //       and error handling. Currently DRM options are merged into the source
  //       object in MamoPlayer.tsx; lifting that logic here will make DRM
  //       engine-agnostic.

  // TODO: Track selection – add `selectAudioTrack(id: string)`,
  //       `selectSubtitleTrack(id: string | 'off')`, and
  //       `selectVideoTrack(id: string)` once the engine exposes a stable
  //       imperative track-selection API. Currently these are driven by source
  //       props in ProMamoPlayer.

  // TODO: Advanced buffering / network – expose `setBufferingStrategy()` to
  //       tune min/max buffer durations, content steering, and adaptive-bitrate
  //       hints. This currently requires undocumented props or custom native
  //       modules.
}
