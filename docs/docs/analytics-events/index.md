---
title: Analytics & Events
---

# Analytics & Events

This section covers playback telemetry, event hooks, and best practices for analytics pipelines.

Use [Pro Player](../pro-player/) for the canonical `analytics` prop setup and event callback examples.

## Event types

### Playback

| Event | Fired when |
|---|---|
| `play` | Playback started or resumed |
| `pause` | Playback paused |
| `seek` | A seek operation completed |
| `ended` | Playback reached the end of the content |
| `buffer_start` | Player stalled waiting for data |
| `buffer_end` | Buffering complete; playback resumed |
| `buffering_start` | Pro-level buffering start (includes diagnostic context) |
| `buffering_end` | Pro-level buffering end |
| `playback_error` | A playback error occurred |
| `excessive_buffering` | Player has stalled an unusually high number of times in this session |

### Session lifecycle

| Event | Fired when |
|---|---|
| `session_start` | Analytics session begins (on first play) |
| `session_end` | Session ends (on `ended`, unmount, or explicit close) |

### Progress milestones

| Event | Fired when |
|---|---|
| `quartile` | Playback crosses a percentage milestone; `quartile` field is `25`, `50`, `75`, or `100` |

### Track changes

| Event | Fired when |
|---|---|
| `quality_change` | User selects a different quality variant; `selectedQuality` is set |
| `subtitle_change` | User changes subtitle track; `selectedSubtitle` is set |
| `audio_track_change` | User changes audio track; `selectedAudioTrack` and `audioTrackId` are set |

### Ad telemetry

| Event | Fired when |
|---|---|
| `ad_start` | An ad break begins; `adPosition` (`preroll`/`midroll`/`postroll`) and `mainContentPositionAtAdStart` are set |
| `ad_complete` | An ad break finishes |
| `ad_error` | An ad fails to load or play; `errorMessage` is set |

### Diagnostics

| Event | Fired when |
|---|---|
| `debug_overlay_opened` | Developer debug overlay becomes visible |
| `debug_overlay_closed` | Developer debug overlay is hidden |

## Common event group shorthand

- **Playback**: `play`, `pause`, `seek`, `ended`, `buffer_start`, `buffer_end`
- **Progress milestones**: `quartile` (`25`, `50`, `75`, `100`)
- **Ad telemetry**: `ad_start`, `ad_complete`, `ad_error`

If you are integrating ad metrics, pair this page with [Ads & Monetization](../ads-monetization/).
