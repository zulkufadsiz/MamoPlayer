# Changelog

All notable changes to the MamoPlayer SDK will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc.1] — 2026-03-20

First release candidate. Both packages ship at the same version.

---

### Core — `@mamoplayer/core`

#### Added

- **`MamoPlayer` component** — React Native video component wrapping `react-native-video` with a typed, normalized API surface.
- **Normalized playback event stream** — `onPlaybackEvent` callback emitting a typed `PlaybackEvent` union: `ready`, `play`, `pause`, `seek`, `ended`, `buffer_start`, `buffer_end`, `error`, `progress`.
- **Transport controls overlay** — play/pause toggle, seek-forward/backward (10 s), and mute, with configurable auto-hide via `ControlsConfig`.
- **Timeline scrubber** — draggable seek bar with time labels, buffered fill, and in-progress scrub preview.
- **Double-tap gesture seek** — `DoubleTapSeekOverlay` for left/right double-tap forward/backward seeks.
- **Settings overlay** — animated slide-in panel with extensible `SettingsOverlayConfig` (custom sections, items, sub-menus).
- **Buffering indicator** — animated spinner shown during `buffer_start` / `buffer_end` transitions.
- **Debug overlay** — `DebugOverlay` component exposing codec, bitrate, resolution, rebuffer count, and current position.
- **Casting support** — `useCasting` hook and `CastingConfig` prop for Chromecast/AirPlay state management.
- **DRM support** — `DrmConfig` prop passed through to `react-native-video`'s DRM layer.
- **Gesture configuration** — `GesturesConfig` to enable or disable double-tap seek and future gesture extensions.
- **ESM + CJS dual build** — `tsup`-based build producing `.js`, `.mjs`, `.d.ts`, and `.d.mts` outputs.

#### Known limitations

- `togglePlayPause` is prop-driven with no imperative call; a one-render-cycle delay is visible on busy JS threads.
- Seek-forward / seek-backward icons are swapped in this build.
- Live streams display `0:00 / 0:00` — LIVE badge and timeline hiding are deferred to a subsequent release.
- `scrubTime` initialises to `0` instead of the current position, causing a brief flash on scrub start.

---

### Pro — `@mamoplayer/pro`

#### Added

- **`ProMamoPlayer` component** — extends Core with all OTT business features as a single drop-in component.
- **Analytics — quartile/session model** — emits `SessionStartEvent`, `QuartileEvent` (0 %, 25 %, 50 %, 75 %, 100 %), `SessionEndEvent`, and `ErrorEvent` via `analytics.onEvent`.
- **Dynamic watermark overlay** — text watermark with configurable `opacity`, `randomizePosition`, and `intervalMs` rotation for anti-piracy UX.
- **Playback restrictions** — `restrictions.disableSeekingForward`, `disableSeekingBackward`, and `maxPlaybackRate` enforced at the JS layer.
- **Theme system** — built-in `light`, `dark`, and `ott` themes; full custom `PlayerThemeConfig` token override for colors, typography, and shape.
- **Icon override** — per-icon component injection via the `icons` prop.
- **Layout variants** — `layoutVariant` prop (`"ott"` and default) for different control arrangement presets.
- **Audio track management** — in-player settings panel for switching dubbed audio tracks (≥ 2 distinct languages).
- **Subtitle track management** — startup selection, settings-menu switching, and custom full-screen cue overlay wired to `react-native-video`'s `textTracks` / `selectedTextTrack`.
- **Quality switching** — source-swap-based quality change exposed through the Pro settings overlay.
- **IMA (Google Interactive Media Ads) integration** — preroll, midroll, and postroll ad loading via the native `MamoAdsModule` bridge; `AdsConfig` and `ImaConfig` types.
- **Picture-in-Picture (PiP)** — `PipConfig` prop with `enabled` / `autoEnter` flags and `onPipStateChange` callback; native bridge for iOS and Android.
- **Pro debug overlay** — extended debug panel with two-finger toggle gesture and `ProDebugConfig.enabled` flag.
- **Thumbnail preview** — `ThumbnailsConfig` prop for seek-bar hover previews.

#### Known limitations

- Seek restrictions are enforced cosmetically only — the native player position is not rolled back on a violation.
- Seek restrictions are bypassed entirely when IMA ads are active.
- `pip.autoEnter` has no effect at runtime (no `AppState` listener wired yet).
- Ad state machine does not reset on source change; prerolls are skipped on revisiting content.
- Quality switch emits a spurious `session_start` analytics event on every source swap.
- No platform guard on IMA or PiP native bridges — will throw in environments without linked native modules (web, Expo Go).

---

### Docs / Example App

#### Added

- Docusaurus documentation site (`docs/`) covering getting started, core API, pro API, theming, ads monetization, and FAQ.
- `CoreDemoScreen` — interactive example demonstrating all Core features.
- `ProDemoScreen` — interactive example demonstrating all Pro features.
- Internal release guides: RC1 notes, RC testing notes, release checklist, publish guides for Core and Pro.
- Versioning and changelog policy documented in `docs/docs/versioning-changelog.md`.

---

## Deferred to Post-RC.1

The following features are scoped and designed but intentionally deferred:

| Feature | Package |
|---------|---------|
| Subtitle track imperative API (`ProMamoPlayerRef`) | Pro |
| Live stream LIVE badge + timeline hide | Core |
| Timeline and buffering indicator accessibility (VoiceOver / TalkBack) | Core |
| Android back-button / Escape key to dismiss settings overlay | Core |
| Web / Expo Go stubs for IMA and PiP native bridges | Pro |
| PiP event emitter singleton (Strict Mode safe) | Pro |
| Unified quality-change surface | Pro |
| Casting getting-started guide | Core |

---

[1.0.0-rc.1]: https://github.com/mamoplayer/mamoplayer/releases/tag/v1.0.0-rc.1
