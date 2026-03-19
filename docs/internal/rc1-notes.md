# RC1 Release Notes — MamoPlayer 1.0.0

**Date:** 2026-03-20  
**Target branch:** `main` (after RC branch merges)  
**Milestone:** First release candidate — packages ship together at `1.0.0`

---

## 1. Release Scope

### `@mamoplayer/core` — public, MIT

Published to npm under `publishConfig.access: "public"`.  
Peer dependencies: `react >=18`, `react-native >=0.72`, `react-native-video >=6`.

| Item | Status |
|------|--------|
| Version | `1.0.0` |
| Registry | npm (public) |
| License | MIT |

### `@mamoplayer/pro` — private, commercial

Published to GitHub Packages (or private npm org) under `publishConfig.access: "restricted"`.  
Peer dependencies: `@mamoplayer/core ^1.0.0`, `react >=18`, `react-native >=0.72`, `react-native-video >=6`.  
See `docs/internal/pro-distribution.md` for publisher and consumer `.npmrc` setup.

| Item | Status |
|------|--------|
| Version | `1.0.0` |
| Registry | GitHub Packages (`https://npm.pkg.github.com`) |
| License | Commercial (UNLICENSED in package.json) |

---

## 2. Major Completed Features

### `@mamoplayer/core`

- **`MamoPlayer` component** — React Native video component wrapping `react-native-video` with a typed, normalized API surface.
- **Normalized playback event stream** — `onPlaybackEvent` callback with typed `PlaybackEvent` union (`ready`, `play`, `pause`, `seek`, `ended`, `buffer_start`, `buffer_end`, `error`, `progress`).
- **Transport controls overlay** — play/pause toggle, seek-forward/backward (10 s), mute, with configurable auto-hide via `ControlsConfig`.
- **Timeline scrubber** — draggable seek bar with time labels, buffered fill, and in-progress scrub preview.
- **Double-tap gesture seek** — `DoubleTapSeekOverlay` for left/right double-tap forward/backward.
- **Settings overlay** — animated slide-in panel with extensible `SettingsOverlayConfig` (custom sections, items, menus).
- **Buffering indicator** — animated spinner shown during `buffer_start` / `buffer_end` transitions.
- **Debug overlay** — `DebugOverlay` component exposing codec, bitrate, resolution, rebuffer count, current position.
- **Casting support** — `useCasting` hook and `CastingConfig` prop for Chromecast/AirPlay state management.
- **DRM support** — `DrmConfig` prop passed through to `react-native-video`'s DRM layer.
- **Gesture configuration** — `GesturesConfig` to toggle double-tap seek and future gesture extensions.
- **ESM + CJS dual build** — `tsup`-based build with `.d.ts` and `.d.mts` declarations.

### `@mamoplayer/pro`

- **`ProMamoPlayer` component** — extends Core with all OTT business features as a single drop-in component.
- **Analytics — quartile/session model** — `SessionStartEvent`, `QuartileEvent` (0 %, 25 %, 50 %, 75 %, 100 %), `SessionEndEvent`, `ErrorEvent` emitted via `analytics.onEvent`.
- **Dynamic watermark overlay** — text watermark with configurable `opacity`, `randomizePosition`, and `intervalMs` rotation to support anti-piracy UX.
- **Playback restrictions** — `restrictions.disableSeekingForward`, `disableSeekingBackward`, `maxPlaybackRate` enforced at the JS layer.
- **Theme system** — built-in `light`, `dark`, and `ott` themes; full custom `PlayerThemeConfig` token override for colors, typography, and shape.
- **Icon override** — per-icon component injection via the `icons` prop.
- **Layout variants** — `layoutVariant` prop (`"ott"` and default) for different control arrangement presets.
- **Audio track management** — in-player settings panel for switching dubbed audio tracks (≥ 2 distinct languages).
- **Subtitle track management** — startup selection, settings-menu switching, custom cue overlay in fullscreen, wired to `react-native-video`'s `textTracks` / `selectedTextTrack`.
- **Quality switching** — source-swap-based quality change exposed through the Pro settings overlay.
- **IMA (Google Interactive Media Ads) integration** — preroll/midroll/postroll ad loading via the native `MamoAdsModule` bridge; `AdsConfig` and `ImaConfig` types.
- **Picture-in-Picture (PiP)** — `PipConfig` prop with `enabled`/`autoEnter` flags and `onPipStateChange` callback; native bridge for iOS and Android.
- **Pro debug overlay** — extended debug panel with two-finger toggle gesture; `ProDebugConfig.enabled` flag.
- **Thumbnail preview** — `ThumbnailsConfig` prop for seek-bar hover previews.

---

## 3. Known Limitations

These are confirmed issues going into RC1. They do not block every integration but will affect specific scenarios and generate support surface. All are tracked in `docs/internal/rc-testing-notes.md`.

### Core

- **Play/pause visual latency** — `togglePlayPause` is fully prop-driven with no imperative `videoRef` call. On a busy JS thread there is a visible delay between the button tap and playback state change.
- **DRM + numeric (bundled) source silently fails** — spreading `drm` config onto a `require()` number discards the asset ID; the player renders a black screen with no error.
- **Duplicate error events** — `onPlaybackEvent` error fires twice per native error because both `MamoPlayer.tsx` and `useCorePlayerController.ts` independently emit it.
- **Live streams display `0:00 / 0:00`** — when `duration` is `0`, both time labels collapse and no LIVE badge is shown.
- **Scrub position preview flashes `0:00`** — `scrubTime` initialises to `0`, not the current position, so the preview label briefly shows the start time when a scrub begins.
- **Custom `topRightActions` disappear during settings panel** — the actions container is fully unmounted when the settings overlay opens.
- **Settings overlay exit can fire on unmounted tree** — the 220 ms exit animation callback may call `onClose` after component unmount.
- **Casting subscription unconditional** — `useCasting()` is called even when `castingEnabled` is false, registering an unnecessary native event listener.
- **`castingEnabled` prop is not yet fully documented** — consumers enabling casting must configure the native `MamoCastModule` manually; there is no getting-started guide for this path yet.

### Pro

- **Seek restrictions are cosmetic only** — `restrictions.disableSeekingForward` / `disableSeekingBackward` returns early in JS but does not roll back the native player position, so the video continues from the new position.
- **Seek restrictions bypassed when IMA is active** — the IMA code path returns before restriction checks run.
- **Ad state machine does not reset on source change** — `hasPlayedPreroll` remains `true` across navigation, causing the preroll to be skipped on revisiting content.
- **`pip.autoEnter` has no effect** — no `AppState` listener is wired; the flag is documented but inert.
- **`pipState` sticks at `'exiting'`** — the bridge has no `mamo_pip_inactive` event, so `pipState` never transitions back to `'inactive'` after PiP closes.
- **IMA `startAds` / `stopAds` never called** — both bridge methods are exported but not imported, which is likely to cause silent ad failures on Android.
- **Quality switch emits spurious `session_start`** — every source swap on quality change triggers a new `session_start` analytics event, inflating session counts.
- **`pendingSessionEndEventRef` leaks on source change during postroll** — `session_end` is never delivered for a session interrupted by a source swap mid-postroll.
- **Audio settings section shown but non-functional for single-language content** — the show guard (`≥ 1 track`) is looser than the action guard (`≥ 2 distinct languages`); items silently do nothing when there is only one language.
- **"Off" subtitle marked selected when manifest default is active** — `null` (manifest default) and `'off'` (user-selected off) are not distinguished in the settings UI.
- **`watermark.opacity` default mismatch** — JSDoc says `0.3`; runtime default is `0.5`.
- **No platform guard on IMA or PiP native bridges** — both eagerly access `NativeModules` at import time; will throw on web, Expo Go, or any environment without the module linked.
- **`getPipEventEmitter()` creates a new emitter per call** — Strict Mode double-mount doubles all PiP events.

---

## 4. Deferred Features (Post-RC1 Milestones)

These are scoped and designed but intentionally deferred. They will ship in a subsequent minor or patch release.

| Feature | Package | Notes |
|---------|---------|-------|
| **Subtitle track imperative API** (`ProMamoPlayerRef`) | `pro` | Convert to `forwardRef`; expose `changeSubtitleTrack(id)` and `currentSubtitleTrackId` on the ref handle. Internal implementation is complete — only the public API surface remains. |
| **Live stream LIVE badge** | `core` | Detect `duration === 0 / Infinity` post-load; render LIVE indicator and hide timeline scrubber. |
| **Timeline accessibility** | `core` | `accessibilityRole="adjustable"`, `accessibilityValue`, `onAccessibilityAction` for VoiceOver / TalkBack navigation. |
| **Buffering indicator accessibility** | `core` | `accessibilityLabel` + `accessibilityLiveRegion` so screen readers announce buffering state. |
| **Android back-button / Escape key for settings overlay** | `core` | `BackHandler` (Android) and keyboard-escape (web) should dismiss the overlay. |
| **Web / Expo Go stubs for IMA and PiP bridges** | `pro` | Add `Platform.OS` guards and no-op web stubs so importing the package does not throw in environments without native modules. |
| **PiP event emitter singleton** | `pro` | Module-level emitter cache to prevent duplicate events under Strict Mode double-mount. |
| **`maxPlaybackRate` restriction in IMA path** | `pro` | Rate clamping is currently applied only in the non-IMA code branch. |
| **Unified quality-change surface** | `pro` | `ProMamoPlayerQualityOverlay` and core settings panel both expose quality controls; consolidate to a single surface. |
| **Stable analytics config reference** | `pro` | Usage guidance / lint rule to prevent inline `analytics={{ onEvent: () => {} }}` triggering IMA re-init on every render. |
| **Casting getting-started guide** | `core` | Document native `MamoCastModule` and `MamoCastModuleBridge` setup for iOS and Android. |

---

## 5. Must-Fix Before Publish

The following issues **must be resolved before the `1.0.0` publish** is tagged. Each maps to a
`🔴 MUST-FIX` entry in `docs/internal/rc-testing-notes.md`.

| # | Issue | File(s) | Fix summary |
|---|-------|---------|-------------|
| 1 | `togglePlayPause` has a one-render-cycle delay | `packages/core/src/hooks/useCorePlayerController.ts` | Call `videoRef.current?.pause()` / `.resume()` synchronously before the state update. |
| 2 | Seek operations run before video has loaded | `packages/core/src/hooks/useCorePlayerController.ts` | Add `if (!hasLoadedRef.current) return;` guard at the top of `seekForward`, `seekBackward`, and `seekTo`. |
| 3 | `handleEnd` post-play pause cleared in controlled mode | `packages/core/src/hooks/useCorePlayerController.ts` | Track an `isEnded` flag; guard the `paused`-sync effect so it does not clear the override after end-of-stream. |
| 4 | Ad state machine never resets on source change / replay | `packages/pro/src/ads/AdState.ts`, `packages/pro/src/ProMamoPlayer.tsx` | Call `adRef.current.reset()` in the `useEffect([source])` cleanup. |
| 5 | Seek-forward / seek-backward icons are swapped | `packages/core/src/components/PlaybackOptions.tsx` | Swap icon names: `replay-10` on backward, `forward-10` on forward. |
| 6 | Timeline thumb overflows track at 0 % and 100 % | `packages/core/src/components/Timeline.tsx` | Replace percentage-based `left` with pixel clamping: `visibleRatio * (trackWidth - THUMB_SIZE)`. |
| 7 | Seek restrictions are cosmetic — native position not rolled back | `packages/pro/src/ProMamoPlayer.tsx` | Issue `playerRef.current?.seek(previousPosition)` after detecting a restriction violation. |
| 8 | Seek restrictions bypassed when IMA is active | `packages/pro/src/ProMamoPlayer.tsx` | Move restriction enforcement above the IMA early-return (or duplicate it in the IMA branch). |
| 9 | `pip.autoEnter` has no effect at runtime | `packages/pro/src/ProMamoPlayer.tsx` | Add `AppState.addEventListener('change', …)` in a `useEffect` to call `requestPip()` on app background when `autoEnter` is true. |

---

## Appendix — Pre-publish Command Sequence

```bash
# 1. Validate
yarn test:packages          # must pass with no skipped tests
yarn lint
yarn format:check
yarn build                  # yarn build:core && yarn build:pro

# 2. Version (creates git tags + CHANGELOG entries)
npm run lerna:version

# 3. Publish
npm run lerna:publish       # core → npm public, pro → GitHub Packages
```

See `docs/internal/release-checklist.md` for the full pre-publish gate.
