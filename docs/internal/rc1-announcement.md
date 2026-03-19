# RC1 Announcement Draft — MamoPlayer 1.0.0-rc.1

**Date:** 2026-03-20
**Status:** Internal draft — not for public distribution
**Version:** `1.0.0-rc.1` (both packages)

---

## Summary

MamoPlayer 1.0.0-rc.1 is the first release candidate of a modular React Native video SDK built for OTT products. Both packages ship together at the same version and cover the full baseline of production-grade playback, analytics, monetization, and content protection features required for an OTT streaming application.

`@mamoplayer/core` is open-source (MIT) and published publicly to npm. `@mamoplayer/pro` is a commercial package distributed privately via GitHub Packages and requires a commercial license.

---

## @mamoplayer/core — Highlights

- **`MamoPlayer` component** — typed, normalized wrapper around `react-native-video` with a consistent prop surface and full TypeScript declarations.
- **Normalized playback event stream** — `onPlaybackEvent` callback emitting a typed `PlaybackEvent` union: `ready`, `play`, `pause`, `seek`, `ended`, `buffer_start`, `buffer_end`, `error`, `progress`.
- **Transport controls overlay** — play/pause toggle, 10-second seek-forward/backward, and mute; configurable auto-hide via `ControlsConfig`.
- **Timeline scrubber** — draggable seek bar with time labels, buffered-fill indicator, and in-progress scrub preview.
- **Double-tap gesture seek** — `DoubleTapSeekOverlay` for left/right double-tap navigation; configurable via `GesturesConfig`.
- **Settings overlay** — animated slide-in panel with extensible `SettingsOverlayConfig` (custom sections, items, and sub-menus).
- **Buffering indicator** — animated spinner shown automatically during `buffer_start`/`buffer_end` transitions.
- **Debug overlay** — `DebugOverlay` component exposing codec, bitrate, resolution, rebuffer count, and current position.
- **Casting support** — `useCasting` hook and `CastingConfig` prop for Chromecast/AirPlay state management.
- **DRM support** — `DrmConfig` prop passed through to `react-native-video`'s DRM layer.
- **ESM + CJS dual build** — `tsup`-based build producing `.js`, `.mjs`, `.d.ts`, and `.d.mts` outputs.

---

## @mamoplayer/pro — Highlights

- **`ProMamoPlayer` component** — drop-in extension of Core that adds all OTT business features without requiring a separate integration.
- **Analytics — quartile/session model** — emits `SessionStartEvent`, `QuartileEvent` (0 %, 25 %, 50 %, 75 %, 100 %), `SessionEndEvent`, and `ErrorEvent` via `analytics.onEvent`.
- **Dynamic watermark overlay** — text watermark with configurable `opacity`, `randomizePosition`, and `intervalMs` position rotation for anti-piracy UX.
- **Playback restrictions** — `restrictions.disableSeekingForward`, `disableSeekingBackward`, and `maxPlaybackRate` enforcement at the JS layer.
- **Theme system** — built-in `light`, `dark`, and `ott` themes; full custom `PlayerThemeConfig` token override for colors, typography, and shape.
- **Icon override** — per-icon component injection via the `icons` prop.
- **Layout variants** — `layoutVariant` prop (`"ott"` and default) for different control arrangement presets.
- **Audio track management** — in-player settings panel for switching between dubbed audio tracks (≥ 2 distinct languages).
- **Subtitle track management** — startup selection, settings-menu switching, and a custom full-screen cue overlay wired to `react-native-video`'s `textTracks`/`selectedTextTrack`.
- **Quality switching** — source-swap-based quality change exposed through the Pro settings overlay.
- **IMA (Google Interactive Media Ads) integration** — preroll, midroll, and postroll ad loading via the native `MamoAdsModule` bridge; `AdsConfig` and `ImaConfig` types.
- **Picture-in-Picture (PiP)** — `PipConfig` prop with `enabled`/`autoEnter` flags and `onPipStateChange` callback; native bridge for iOS and Android.
- **Thumbnail preview** — `ThumbnailsConfig` prop for seek-bar hover previews.
- **Pro debug overlay** — extended debug panel with two-finger toggle gesture and `ProDebugConfig.enabled` flag.

---

## Current Limitations

The following issues are confirmed for RC1. They do not block all integrations, but teams should be aware before evaluating specific features.

### @mamoplayer/core

| Issue | Impact |
|---|---|
| `togglePlayPause` is prop-driven with no imperative call; observable delay on busy JS threads | Medium |
| Seek-forward and seek-backward icons are swapped on transport controls | High (visible to all users) |
| Seek operations do not guard against calls before the video has loaded | Medium |
| Live streams display `0:00 / 0:00` — no LIVE badge or timeline hide | High (live content unusable) |
| `scrubTime` initialises to `0`, causing a brief flash of `0:00` on scrub start | Low |
| `onPlaybackEvent` error fires twice per native error (duplicate handler) | Medium |
| Casting event subscription registered even when `castingEnabled` is false | Low |

### @mamoplayer/pro

| Issue | Impact |
|---|---|
| Seek restrictions are enforced cosmetically only — native position is not rolled back | High (security/DRM concern) |
| Seek restrictions are bypassed entirely when IMA ads are active | High |
| Ad state machine does not reset on source change; prerolls are skipped on revisit | High |
| `pip.autoEnter` has no effect at runtime (no `AppState` listener wired) | Medium |
| IMA native bridge methods `startAds`/`stopAds` are not imported; silent ad failures possible | High |
| Quality switch emits a spurious `session_start` analytics event on every source swap | Medium |
| `watermark.opacity` default in JSDoc (`0.3`) does not match runtime default (`0.5`) | Low |
| No platform guard on IMA or PiP native bridges — will throw in Expo Go and web environments | Medium |

### Deferred Features (not in RC1)

- Live stream LIVE badge + timeline hide
- Subtitle track imperative API (`ProMamoPlayerRef`)
- Web / Expo Go stubs for IMA and PiP native bridges
- `pip.autoEnter` via `AppState` listener
- Timeline and transport controls accessibility (VoiceOver / TalkBack)
- Android back-button / Escape key to dismiss the settings overlay
- Unified quality-change surface

---

## Who RC1 Is For

RC1 is intended for the following audiences exclusively. It is **not** a general-availability release.

**Internal team** — Final validation of the full feature set, build pipeline, and release tooling before GA. Use this to run the complete release checklist and confirm no blocking issues remain.

**Selected early adopters** — Developers who have been in contact with the team and agreed to evaluate a pre-release build. Feedback from this group is actively sought and will directly inform the GA release.

**Technical evaluators** — Teams assessing MamoPlayer for an upcoming OTT project who need to validate integration fit, API surface, and Pro feature availability before committing. Evaluators should be made aware of the current limitations listed above.

RC1 is **not** recommended for:

- Production deployments.
- Apps targeting Expo Go or web without native bridge setup.
- Use cases that depend on live stream support, seek restriction enforcement, or ad state reset (see limitations above).

---

## Installation (RC1)

```bash
# Core (public)
npm install @mamoplayer/core@1.0.0-rc.1 react-native-video

# Pro (requires GitHub Packages auth — see docs/internal/pro-distribution.md)
npm install @mamoplayer/pro@1.0.0-rc.1
```

Peer dependencies: `react >=18`, `react-native >=0.72`, `react-native-video >=6`.

---

## Contacts

Questions about RC1 access, licensing, or feedback should be directed to [contact@mamoplayer.com](mailto:contact@mamoplayer.com).
