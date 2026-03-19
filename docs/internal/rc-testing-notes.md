# Release-Candidate Testing Notes

**Date:** 2026-03-19  
**Branch:** `455-add-release-candidate-testing-pass-for-major-flows`  
**Scope:** Static code analysis + test-coverage audit across all major player flows

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 **MUST-FIX** | Blocks release — broken user-facing behaviour |
| 🟠 **SHOULD-FIX** | Rough edge that will generate support tickets |
| 🟡 **NICE-TO-HAVE** | Low risk; can be scheduled post-release |
| ⬜ **TEST-GAP** | Missing test coverage (no runtime breakage confirmed) |

---

## 1. Core Player

### 1.1 Playback

#### 🔴 `togglePlayPause` has a one-render-cycle delay (no imperative call)
**File:** `packages/core/src/hooks/useCorePlayerController.ts`  
Play/pause is entirely prop-driven. There is no `videoRef.current?.pause()` or `videoRef.current?.resume()` imperative call. On a busy JS thread the video continues playing for an observable moment after the user taps the button.  
**Fix:** Call `videoRef.current?.pause()` / `videoRef.current?.resume()` synchronously, before the state update.

#### 🔴 Seek operations run before the video has loaded
**File:** `packages/core/src/hooks/useCorePlayerController.ts`  
`seekForward`, `seekBackward`, and `seekTo` do not check `hasLoadedRef.current`. Calling them before `handleLoad` fires issues a native seek on an uninitialised player, producing undefined behaviour on both platforms.  
**Fix:** Add `if (!hasLoadedRef.current) return;` guard at the top of each seek function.

#### 🔴 `handleEnd` post-play pause is silently cleared in controlled mode
**File:** `packages/core/src/hooks/useCorePlayerController.ts`  
After video end, `setPausedOverride(true)` stops the video. Any subsequent re-render in which the parent supplies a new value for the `paused` prop triggers `setPausedOverride(null)` (via the sync effect), clearing the end-of-stream pause. In controlled mode this can cause the video to loop unexpectedly.  
**Fix:** Track an `isEnded` flag and guard the `paused`-sync effect so it does not clear the override once the video has ended.

#### 🔴 Ad state machine never resets between replays / source changes
**File:** `packages/pro/src/ads/AdState.ts`, consumed in `ProMamoPlayer.tsx`  
`AdStateMachine.reset()` exists but is never called. Navigating away and returning to the same source skips the preroll because `hasPlayedPreroll` is still `true` from the previous session.  
**Fix:** Call `adRef.current.reset()` in the `useEffect([rest.source])` cleanup / run callback.

#### 🟠 DRM + numeric (bundled-asset) source silently produces an empty video
**File:** `packages/core/src/MamoPlayer.tsx`  
When `source` is a `require()` numeric identifier and the `drm` prop is set, `{ ...42, drm: { … } }` evaluates to `{ drm: { … } }`. The asset ID is lost, the `<Video>` element receives no source and renders a black screen with no error.  
**Fix:** Guard the DRM merge: `if (typeof source === 'number') return source;` before spreading.

#### 🟠 `handleError` is duplicated — events fired twice
**Files:** `packages/core/src/MamoPlayer.tsx` and `packages/core/src/hooks/useCorePlayerController.ts`  
Both files independently parse `OnVideoErrorData` and emit `onPlaybackEvent` error events. A native video error surfaces twice to every analytics consumer.  
**Fix:** Remove the duplicate in `MamoPlayer.tsx`; let the controller be the single source of truth.

#### 🟡 `castingEnabled={false}` still subscribes to native casting events
**File:** `packages/core/src/MamoPlayer.tsx`  
`useCasting()` is called unconditionally. When casting is disabled (the default for most users) a native event subscription is registered unnecessarily.  
**Fix:** Call `useCasting()` only when `castingEnabled === true`.

---

### 1.2 Timeline

#### 🔴 Seek-forward icon appears on the "backward" button and vice versa
**File:** `packages/core/src/components/PlaybackOptions.tsx`  
```
Backward button → MaterialIcons name="forward-10"   ← shows →10 icon
Forward button  → MaterialIcons name="replay-10"    ← shows ↩10 icon
```
Every user sees the wrong icons on transport controls.  
**Fix:** Swap the icon names (`replay-10` on backward, `forward-10` on forward).

#### 🔴 Timeline thumb overflows the track at 0 % and 100 %
**File:** `packages/core/src/components/Timeline.tsx`  
`left: \`${visibleRatio * 100}%\`` combined with `marginLeft: -THUMB_SIZE/2` clips the thumb off the left edge at the start and off the right edge at the end.  
**Fix:** Use pixel-based clamping: `left: visibleRatio * (trackWidth - THUMB_SIZE)`.

#### 🟠 `buffered` prop documentation says "ahead of current position" but it is absolute
**File:** `packages/core/src/components/Timeline.tsx`  
The JSDoc states the value is relative; callers who read the docs and pass `currentPosition + lookahead` will see the buffered fill rendered at a completely wrong position.  
**Fix:** Correct the JSDoc to state the value is an absolute elapsed time (as provided by `react-native-video`'s `playableDuration`).

#### 🟠 Live streams show `0:00 / 0:00` — no LIVE badge
**File:** `packages/core/src/MamoPlayer.tsx`  
When `duration` is `0` (live stream), both time labels collapse to `0:00` and the timeline renders an empty track. There is no "LIVE" indicator.  
**Fix:** Detect `duration === 0` (or `Infinity`) after `handleLoad` and render a LIVE badge; hide the timeline scrubber.

#### 🟠 `onSeek` prop name is misleading — it is wired to the scrub-move callback, not a commit
**File:** `packages/core/src/MamoPlayer.tsx`, `packages/core/src/components/Timeline.tsx`  
`<Timeline onSeek={handleScrubSeek} />` — `handleScrubSeek` only updates the in-progress scrub position; the actual `videoRef.seek()` is deferred to `handleScrubEnd`. A simple tap triggers `grant → release → handleScrubEnd`, so it works, but the naming sets a wrong contract for future contributors.  
**Fix:** Rename `onSeek` to `onScrubStart` or align the handler so a simple tap does call `seek()` immediately.

#### 🟡 `scrubTime` initial state is `0`, not `currentPosition`
**File:** `packages/core/src/components/Timeline.tsx`  
When a scrub begins, the preview label briefly flashes `0:00` before the first `setScrubTime` lands.  
**Fix:** Initialise `scrubTime` state to the current `position` prop value.

#### ⬜ Timeline has no accessibility support
**File:** `packages/core/src/components/Timeline.tsx`  
No `accessibilityRole="adjustable"`, no `accessibilityValue`, no `onAccessibilityAction`. VoiceOver / TalkBack users cannot navigate by time.

---

### 1.3 Settings Overlay

#### 🟠 Custom `topRightActions` disappear while settings panel is open
**File:** `packages/core/src/MamoPlayer.tsx`  
The entire `Animated.View` containing custom top-right actions is unmounted when `isSettingsOpen` is true. User-supplied action buttons vanish mid-session.  
**Fix:** Keep the overlay mounted but use `pointerEvents="none"` + reduced opacity (or let the settings panel layer above it) instead of unmounting.

#### 🟠 Settings overlay exit animation can fire `onClose` on an unmounted tree
**File:** `packages/core/src/components/SettingsOverlay.tsx`  
If the parent force-closes the overlay before the 220 ms exit animation finishes, the `Animated.timing` callback calls `onDone?.() → onClose` on an already-unmounted component.  
**Fix:** Return an `anim.stop()` cleanup from both `animateTo` `useEffect` calls; guard via a mounted-ref.

#### 🟡 Android back-button and Escape key (web) do not dismiss the overlay
**File:** `packages/core/src/components/SettingsOverlay.tsx`  
No `BackHandler` (Android) or keyboard-escape handler is registered.

#### 🟡 `extraContent` inside `ScrollView` causes nested-scroll issues
**File:** `packages/core/src/components/SettingsOverlay.tsx`  
Passing another `ScrollView` as `extraContent` results in nested scrolling, where the inner scroll captures all touches.

---

### 1.4 Playback Speed

#### 🟠 Quality overlay and core settings panel both show quality options
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
`ProMamoPlayerQualityOverlay` and the `coreSettingsOverlayConfig` quality section both present quality choices. Users can change quality from two separate places; state can visually diverge between them.  
**Fix:** Remove quality from one surface (prefer the unified settings overlay).

#### 🟡 Playback rate validation — `restrictions.maxPlaybackRate` silently ignored in IMA path
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
`handlePlaybackEvent` has two branches (IMA and non-IMA). Rate clamping via `restrictions.maxPlaybackRate` is applied only in the non-IMA branch.

---

### 1.5 Mute

#### 🟡 `BufferingIndicator` animation not cancelled on unmount
**File:** `packages/core/src/components/BufferingIndicator.tsx`  
`Animated.timing` launched in a `useEffect` has no cleanup. If the component unmounts mid-animation (e.g., during a source swap) the callback fires on an unmounted tree and the animation loop continues briefly.  
**Fix:** Return `() => anim.stop()` from the effect.

#### ⬜ Buffering indicator missing accessibility announcement
**File:** `packages/core/src/components/BufferingIndicator.tsx`  
`accessibilityLabel` and `accessibilityLiveRegion` are absent. Screen readers do not announce buffering state.

#### ⬜ `rebufferCount` in debug overlay counts the initial pre-play buffer
**File:** `packages/core/src/MamoPlayer.tsx`  
The first buffering event (initial load) increments `rebufferCount` before any playback has started. The debug panel always opens showing "Rebuffers: 1" on a fresh source.  
**Fix:** Only increment if `hasLoadedRef.current && isPlaying` is already true.

---

## 2. Pro Player

### 2.1 Tracks

#### 🟠 Audio settings section visible but non-functional with a single dub language
**File:** `packages/pro/src/hooks/useProSettingsSections.ts`  
`shouldShowAudio` requires ≥ 1 audio track; `changeAudioTrack` is guarded by `shouldShowAudioTrackSettings` (≥ 2 distinct languages). Content with a single audio track in one language renders an audio section whose items silently do nothing when pressed.  
**Fix:** Align the show-condition to `shouldShowAudioTrackSettings` (the stricter guard).

#### 🟠 "Off" subtitle shown as selected when `currentSubtitleTrackId === null` (manifest default)
**File:** `packages/pro/src/hooks/useProSettingsSections.ts`  
`null` means the manifest's default subtitle is active, not that subtitles are off. The settings UI misleadingly marks the "Off" item as selected.  
**Fix:** Only mark "Off" selected when the ID is the explicit `'off'` sentinel.

#### 🟡 Imperative subtitle-track switching not yet exposed via ref handle
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
A `TODO` comment notes that `changeSubtitleTrack` should be exposed on the player's imperative ref but the design has not been started.

---

### 2.2 Ads

#### 🔴 Seek restrictions are enforced cosmetically only — native player ignores them
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
`restrictions.disableSeekingForward` / `disableSeekingBackward` returns early from the event handler but does not call `playerRef.current?.seek(previousPosition)` to roll back the native player. The video continues playing from the new position.  
**Fix:** On a restricted seek event, issue `playerRef.current?.seek(previousPosition)` immediately after detecting the violation.

#### 🔴 Seek restrictions entirely bypassed when IMA is enabled
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
The IMA code-path returns before the restriction checks run. Any content using Google IMA ads ignores all configured `restrictions`.  
**Fix:** Move restriction enforcement above the IMA early return (or duplicate it in the IMA branch).

#### 🟠 `pendingSessionEndEventRef` leaks on source change during a postroll
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
If the source changes while a postroll ad is playing, `pendingSessionEndEventRef` is never flushed. No `session_end` analytics event reaches the consumer for the interrupted session.

#### 🟠 Quality switch fires a spurious `session_start` analytics event
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
Every quality change triggers a source swap, which on the next `ready` event unconditionally emits `session_start`. Repeated quality switches inflate session-start counts in every analytics backend.  
**Fix:** Track whether the `ready` event is from a quality swap vs a fresh session and skip `session_start` emission for quality re-loads.

#### 🟠 IMA `startAds` / `stopAds` bridged but never called
**File:** `packages/pro/src/ima/nativeBridge.ts`  
Both methods are exported but not imported anywhere. If the native SDK requires an explicit `startAds()` call (it does on Android), IMA ads will silently fail to play on Android.  
**Fix:** Audit the native Android / iOS module contracts and call `startAds()` after `loadAds()` resolves.

#### 🟡 Rapid `analytics` object re-creation causes IMA re-initialisation loop
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
`useEffect([analytics, ...])` captures the whole config object reference. An inline `analytics={{ onEvent: () => {} }}` prop triggers `loadAds` on every parent render.  
**Fix:** Use stable callbacks or extract a stable identity with `useMemo` / `useCallback` at the call site; document this requirement.

---

### 2.3 Thumbnails

#### 🟠 `watermark.opacity` default mismatch between docs and code
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
JSDoc says default `0.3`; actual fallback is `0.5`. The discrepancy will confuse integrators tweaking opacity.  
**Fix:** Align JSDoc to `0.5` (or change the runtime default to `0.3`).

#### ⬜ `detectSourceType` returns `'streaming'` for an empty array source
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
`source = []` (edge case) causes `source[0]` to be `undefined`; the type detection falls through to `'streaming'`, potentially firing analytics with wrong metadata.

---

### 2.4 PiP (Picture-in-Picture)

#### 🔴 `pip.autoEnter` has zero effect at runtime
**File:** `packages/pro/src/ProMamoPlayer.tsx`  
The `PipConfig.autoEnter` field is documented as "Automatically enter PiP when the app is backgrounded" but no `AppState` listener or effect ever calls `requestPip` on app background. The flag is completely inert.  
**Fix:** Add `AppState.addEventListener('change', (s) => s === 'background' && autoEnter && requestPip())` inside a `useEffect`.

#### 🟠 `pipState` sticks at `'exiting'` indefinitely — no `mamo_pip_inactive` event
**File:** `packages/pro/src/pip/nativeBridge.ts`  
The bridge only subscribes to `mamo_pip_active` and `mamo_pip_exiting`. There is no `mamo_pip_inactive` event, so after the PiP window fully closes, `pipState` remains `'exiting'` until the next `onPictureInPictureStatusChanged` from the Video component — which may never fire on all platforms.  
**Fix:** Either emit `mamo_pip_inactive` from the native layer, or transition to `'inactive'` after a timeout / on `mamo_pip_exiting` directly.

#### 🟡 `getPipEventEmitter()` creates a new `NativeEventEmitter` per call
**File:** `packages/pro/src/pip/nativeBridge.ts`  
Multiple calls (e.g., from a double-mount in Strict Mode) create multiple emitters, doubling all PiP events. Cache the emitter as a module-level singleton.

#### ⬜ No platform guard on IMA or PiP native bridges
**Files:** `packages/pro/src/ima/nativeBridge.ts`, `packages/pro/src/pip/nativeBridge.ts`  
Both eagerly access `NativeModules` at import time. On web, Expo Go, or any environment without the native module linked, every API call throws.  
**Fix:** Add `Platform.OS`-based guards and provide a no-op web stub.

---

### 2.5 Debug Overlay

#### 🟠 `toggleDebugOverlay` ignores `debug.enabled` flag
**File:** `packages/pro/src/hooks/useProPlayerController.ts`  
`showDebugOverlay` guards on `debugRef.current?.enabled`, but `toggleDebugOverlay` does not. The two-finger gesture can show the debug panel even when `debug.enabled = false`.  
**Fix:** Align `toggleDebugOverlay` to check `debugRef.current?.enabled` before toggling.

#### 🟠 Debug overlay not hidden when `debug.enabled` flips to `false`
**File:** `packages/pro/src/hooks/useProPlayerController.ts`  
Setting `debug.enabled = false` at runtime (e.g., a feature flag change) does not hide an already-visible debug panel. A `useEffect([debugRef.current?.enabled])` should call `setDebugVisible(false)` when the flag turns off.

#### 🟡 `rebufferCount` rendered with two decimal places
**File:** `packages/pro/src/ui/DebugOverlay.tsx`  
The `fmt()` helper applies `.toFixed(2)` to all numbers. Integers like `3` display as `3.00`.  
**Fix:** Use integer formatting when the value is a whole number.

#### 🟡 Debug panel hardcoded dimensions — clips on small phones in landscape
**File:** `packages/pro/src/ui/DebugOverlay.tsx`  
`maxHeight: 340`, `width: 240` are fixed constants. The panel can overflow or be clipped on small landscape devices.

---

## 3. UX

### 3.1 Auto-Hide Controls

#### 🟠 `scheduleControlsAutoHide` can schedule with stale `controlsVisible` value
**File:** `packages/core/src/hooks/useCorePlayerController.ts`  
`showControls()` calls `setControlsVisible(true)` then immediately calls `scheduleControlsAutoHide`. The closure captures the *pre-setState* value of `controlsVisible`, so the guard `if (!controlsVisible) return` may fire incorrectly, preventing the auto-hide from being scheduled after showing the controls.  
**Fix:** Move auto-hide scheduling into the `setControlsVisible` updater callback or a dedicated `useEffect([controlsVisible])`.

#### ⬜ Auto-hide behaviour has zero test coverage
**File:** `packages/core/src/MamoPlayer.test.tsx`  
No test verifies that controls become hidden after `autoHideDelay` ms of inactivity, or that interaction (tap, scrub) resets the timer.

#### ⬜ Tap-to-toggle controls has zero test coverage
**File:** `packages/core/src/MamoPlayer.test.tsx`  
Single-tap on `core-player-surface` toggling control visibility is not tested at all.

---

### 3.2 Double-Tap Seek

#### 🟠 Seek indicator always displays "10s" regardless of configured seek amount
**File:** `packages/core/src/components/DoubleTapSeekOverlay.tsx`  
```tsx
<Text>{side === 'left' ? '⏪ 10s' : '⏩ 10s'}</Text>
```
If the caller passes a custom seek distance (e.g., `seekForward(5)`) the label still says "10s". Any change to the default 10-second seek amount will produce a visible UI/logic mismatch.  
**Fix:** Accept a `seekAmount` prop (forward and backward independently) and interpolate into the label.

#### 🟠 Cross-side double-tap fires `onSingleTap` twice
**File:** `packages/core/src/components/DoubleTapSeekOverlay.tsx`  
Tapping left then (within 300 ms) tapping right starts two independent 300 ms timers. Both fire `onSingleTap()` when they expire since neither side cancels the other's timer on a cross-side tap.  
**Fix:** Use a shared "last tap" ref that cancels any pending single-tap timers when either side is activated.

#### 🟡 `TouchableWithoutFeedback` is deprecated
**File:** `packages/core/src/components/DoubleTapSeekOverlay.tsx`  
Replace with `Pressable`.

#### 🟡 Double-tap delay and seek amount are not configurable
**File:** `packages/core/src/components/DoubleTapSeekOverlay.tsx`  
`DOUBLE_TAP_DELAY_MS = 300` is hardcoded. It is not surfaced in `GesturesConfig`.  
**Fix:** Expose as `gestures.doubleTapDelayMs`.

---

### 3.3 Buffering Indicator

#### 🟠 Controls overlay (including top-right actions) unmounted while settings panel is open
**File:** `packages/core/src/MamoPlayer.tsx`  
The `isSettingsOpen` guard unmounts the entire controls `Animated.View`. On reopening the settings panel, the controls overlay re-mounts from scratch, restarting any entrance animations and potentially resetting auto-hide timers.  
**Fix:** Layer the settings panel above the controls using absolute positioning; never unmount the controls overlay while the player is active.

#### 🟠 `renderPlayer()` is called twice sharing a single `videoRef`
**File:** `packages/core/src/MamoPlayer.tsx`  
The player is rendered once in the inline branch and once inside a `<Modal>` for fullscreen. They share a single `videoRef`. If the `isFullscreen` transition lands while a React render is in flight, briefly both Video elements could mount and the ref points to whichever committed last.  
**Fix:** Extract `VideoElement` into a stable memoised component that is conditionally portaled rather than duplicated.

---

## 4. ReactNativeVideoAdapter (dead code)

#### 🟠 Adapter is thoroughly documented but never used
**File:** `packages/core/src/player/engine/reactNativeVideoAdapter.ts`  
All call sites in `useCorePlayerController` bypass the adapter and call `videoRef.current?.seek()`, `pause()`, `resume()` directly. The adapter's goals (single seam for engine swap, logging, mocking) are stated in JSDoc but unrealised.  
**Fix:** Either wire all imperative video calls through the adapter, or remove it and delete the outstanding TODOs to avoid misleading future contributors.

---

## 5. Theme

#### 🟠 `themeName` completely ignored when `theme` prop is also provided
**File:** `packages/pro/src/theme/ThemeContext.tsx`  
Documentation implies a merge ("uses `themeName` as the base"), but the code is `if (theme) return theme` — no merge occurs.  
**Fix:** Deep-merge `getThemeByName(themeName)` with the consumer-supplied `theme` overrides.

#### 🟡 `getDefaultTheme` falls back to `lightTheme`; everywhere else defaults to `darkTheme`
**File:** `packages/pro/src/theme/defaultThemes.ts`  
Inconsistent default produces subtle theming bugs if `getDefaultTheme` is ever called without a valid `name`.

---

## 6. Licensing

#### 🟡 License check is computed once at mount, never re-evaluated
**File:** `packages/pro/src/licensing/license.ts`  
If `licenseKey` is loaded asynchronously (common with remote config), the first render sees `undefined`, fires the warning, and subsequent renders with the real key never re-check.  
**Fix:** Move `validateLicenseKey` into a `useEffect([licenseKey])`.

#### 🟡 Module-level `grantedPremiumFeatures` singleton is shared across instances
**File:** `packages/pro/src/licensing/entitlements.ts`  
Multiple `ProMamoPlayer` instances on the same screen share the same entitlements set. `clearPremiumEntitlements()` in one teardown clears features for all live instances.

---

## 7. Test Coverage Gaps

### Core package

| Gap | Severity |
|-----|----------|
| Controls auto-hide timer behaviour | 🟠 |
| Tap-to-toggle controls visibility | 🟠 |
| Seek clamping at 0 and duration boundaries | 🟠 |
| Buffering indicator appears / disappears | 🟡 |
| `source_type` event payload fields (beyond `type`) | 🟡 |
| `debug.enabled` has a rendered effect | 🟡 |
| `onReadyForDisplay` callback fired | ⬜ |
| Fullscreen `presentFullscreenPlayer` path | ⬜ |
| DRM + numeric source combination | 🔴 |
| `settingsOverlay.extraMenuItems` initial selection | ⬜ |
| Double-render bug in "seeks forward" test | 🔴 |

### Pro package

| Gap | Severity |
|-----|----------|
| Preroll + postroll in the same session | 🟠 |
| `analytics.sessionId` on non-ad events | 🟠 |
| PiP re-disable via re-render | 🟡 |
| Multiple rapid quality switches | 🟠 |
| Thumbnail boundary frame selection | 🟡 |
| `restrictions` with IMA enabled | 🔴 |
| Dark theme styling | ⬜ |

### Demo screens

| Gap | Severity |
|-----|----------|
| Play MP4/HLS/Invalid source buttons in `CoreDemoScreen` | 🟡 |
| Ref-based seek / fullscreen in `CoreDemoScreen` | 🟠 |
| PiP toggle prop assertion in `ProDemoScreen` | 🟠 |
| Switch index fragility in `ProDemoScreen` restrictions test | 🟠 |
| Analytics event log display in both demo screens | 🟡 |
| 3 missing OTT hint row assertions in `ProDemoScreen` | ⬜ |

---

## 8. Must-Fix Summary Before Release

The following issues are considered blockers (🔴) and must be resolved before the release candidate is promoted:

1. **Seek-forward / seek-backward icons are swapped** on transport controls (`PlaybackOptions.tsx`).
2. **Ad state machine not reset** on source change — preroll skipped on replay.
3. **Seek restrictions are cosmetic-only** — native player ignores them; IMA path bypasses them entirely.
4. **`seekForward` / `seekTo` / `seekBackward` execute before video load** — undefined native behaviour.
5. **`handleEnd` pause cleared on re-render** — video can loop unexpectedly in controlled mode.
6. **DRM + numeric source bug** — silently renders a black screen with no error.
7. **Double-render in "seeks forward" test** — test is broken and gives a false-negative signal.

---

## 9. Recommended Short-Term Actions

In priority order for the RC sprint:

1. Fix icon swap in `PlaybackOptions.tsx` (one-line change, high visibility).
2. Add `adRef.current.reset()` in the `useEffect([rest.source])` block.
3. Issue `playerRef.current?.seek(previousPosition)` on restricted seeks; apply to both IMA and non-IMA paths.
4. Guard seek functions with `if (!hasLoadedRef.current) return`.
5. Guard DRM spread with `if (typeof source === 'number') return source`.
6. Fix the double-render in `MamoPlayer.test.tsx` "seeks forward" test.
7. Add `pip.autoEnter` `AppState` listener.
8. Fix `toggleDebugOverlay` to respect `debug.enabled`.
9. Align `themeName` + `theme` merge in `ThemeContext`.
10. Add `accessibilityRole="adjustable"` + `accessibilityValue` to `Timeline`.
