# RC1 Evaluation Guide — MamoPlayer 1.0.0

**Date:** 2026-03-20  
**Version:** `1.0.0-rc.1`  
**Audience:** Early testers and integration partners

This guide tells you what to test, what to expect, and how to share feedback before the stable `1.0.0` release.

---

## Setup

Install the RC packages into your React Native project:

```bash
# Core (public npm)
npm install @mamoplayer/core@1.0.0-rc.1

# Pro (GitHub Packages — requires a token with read:packages scope)
npm install @mamoplayer/pro@1.0.0-rc.1
```

For full install and peer-dependency instructions see `docs/internal/install-validation.md`.

---

## 1. Testing `@mamoplayer/core`

### Playback

| Scenario | What to verify |
|----------|---------------|
| Load and auto-play a remote URL | Video starts within a reasonable time; no black screen |
| Tap play / pause | Visual state changes immediately; no observable delay |
| Seek forward / backward (double-tap or transport buttons) | Position jumps correctly; seeking before load does not crash |
| Seek by dragging the timeline | Position updates on release; video resumes from new position |
| Play to end | Video stops at the last frame; no unexpected loop |
| Simulate a network interruption | Buffering spinner appears; playback recovers when connectivity returns |
| Supply an invalid source URL | `onPlaybackEvent` error event fires **once** (not twice) |

> **Known issue:** Play/pause has a one-render-cycle visual delay on a busy JS thread. A fix is targeted before the stable release.

### Timeline

| Scenario | What to verify |
|----------|---------------|
| Seek bar thumb position at 0 % | Thumb is fully visible; not clipped by the left edge |
| Seek bar thumb position at 100 % | Thumb is fully visible; not clipped by the right edge |
| Buffered fill | Blue fill advances ahead of the playhead as the video buffers |
| Scrub-time label | Label shows time at the scrubbed position, not `0:00` |
| Forward / backward icons | Forward button shows the →10 icon; backward shows the ↩10 icon |

> **Known issue:** The timeline thumb can overflow the track at the start and end positions. A pixel-clamping fix is targeted for stable.

### Settings

| Scenario | What to verify |
|----------|---------------|
| Open settings overlay | Overlay slides in smoothly; does not dismiss instantly |
| Interact with a settings item | Expected action fires; overlay can be dismissed afterwards |
| Mount / unmount player rapidly | No "state update on unmounted component" warnings |

---

## 2. Testing `@mamoplayer/pro`

### Tracks (Audio & Subtitles)

| Scenario | What to verify |
|----------|---------------|
| Source with 2+ audio languages | Audio track section appears in settings; switching changes the audio |
| Source with only 1 audio language | Audio section is **not** shown, or items are disabled (no silent no-ops) |
| Subtitles on | Subtitle cues render correctly over the video |
| Subtitles off | Cues disappear; settings UI reflects "Off" state |

> **Known issue:** The audio-track settings section may appear but be non-functional for single-language content. The subtitle "Off" state does not yet distinguish between user-selected off and the manifest default.

### Ads (IMA)

| Scenario | What to verify |
|----------|---------------|
| Preroll | Ad plays before main content on first load |
| Navigate away and return to the same source | Preroll plays again (not skipped) |
| Midroll | Ad interrupts content at the configured cue point |
| Postroll | Ad plays after content ends |
| Ad controls | Standard IMA learn-more / skip button (if configured) renders correctly |

> **Known issue:** The ad state machine does not reset on source change — preroll may be skipped on revisit. A fix is included in the must-fix list before stable.

### Thumbnails

| Scenario | What to verify |
|----------|---------------|
| Hover / drag seek bar | Thumbnail preview image appears above the seek bar |
| Thumbnail timing | Image corresponds to the scrub position, not a fixed frame |
| No `thumbnails` config | No thumbnail UI is shown; no errors |

### Debug Overlay

| Scenario | What to verify |
|----------|---------------|
| `ProDebugConfig.enabled = true` | Two-finger tap toggles the debug panel |
| Panel content | Codec, bitrate, resolution, rebuffer count, and current position are shown |
| `ProDebugConfig.enabled = false` | Panel cannot be opened; no gesture interference |

### Picture-in-Picture (PiP)

| Scenario | What to verify |
|----------|---------------|
| `pip.enabled = true` + background app | PiP window opens on iOS and Android |
| Return to app | PiP closes; full-screen player resumes |
| `onPipStateChange` callback | Fires with correct states (`entering`, `active`, `exiting`) |

> **Known issues:**
> - `pip.autoEnter` is documented but currently has no effect (no `AppState` listener is wired). Do not rely on it for RC testing.
> - `pipState` may remain stuck at `'exiting'` after PiP closes. This is a native bridge gap targeted for stable.

---

## 3. Experimental Features

The following features are available in RC1 but carry elevated risk. Test them, but do not build production flows that depend on them yet.

| Feature | Package | Risk |
|---------|---------|------|
| **Seek restrictions** (`disableSeekingForward`, `disableSeekingBackward`) | `pro` | Restrictions are enforced in JS only. The native player position is not rolled back, so the video continues from the new position despite the guard. |
| **Playback restrictions + IMA** | `pro` | Seek restrictions are bypassed entirely when an IMA ad is active. |
| **Quality switching** | `pro` | Each source swap emits a spurious `session_start` analytics event, inflating session counts. |
| **Casting** (`castingEnabled`, `useCasting`) | `core` | The native `MamoCastModule` setup is not yet documented. The hook also subscribes to native events unconditionally, even when casting is disabled. |
| **DRM + bundled asset source** | `core` | Combining a `require()` numeric source with a `drm` config silently discards the asset ID and renders a black screen. |
| **Live streams** | `core` | Duration reads `0:00 / 0:00` for live sources; no LIVE badge is shown. Deferred to a post-RC patch. |

---

## 4. Reporting Feedback and Issues

Before filing a report, check `docs/internal/rc-testing-notes.md` — the issue may already be tracked with a planned fix.

**For bug reports**, please include:

- Package versions (`@mamoplayer/core` and/or `@mamoplayer/pro`)
- Platform (iOS / Android) and OS version
- React Native version
- A minimal reproducible snippet or steps to reproduce
- Observed behaviour vs. expected behaviour
- Any relevant console output or native crash log

**Where to file:**

- **GitHub Issues** — preferred for bugs and unexpected behaviour
- **GitHub Discussions** — preferred for integration questions, API feedback, and "how do I…" questions
- **Direct contact** — for commercial / licensing matters related to `@mamoplayer/pro`

Tag your issue with `rc1` so it is triaged against the stable release milestone.

---

*Thank you for testing RC1. Your feedback directly shapes the stable release.*
