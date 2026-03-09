---
title: Analytics & Events
---

# Analytics & Events

This section covers playback telemetry, event hooks, and best practices for analytics pipelines.

Use [Pro Player](../pro-player/) for the canonical `analytics` prop setup and event callback examples.

## Common event groups

- Playback: `play`, `pause`, `seek`, `ended`, `buffer_start`, `buffer_end`
- Progress milestones: `quartile` (`25`, `50`, `75`, `100`)
- Ad telemetry: `ad_start`, `ad_complete`, `ad_error`

If you are integrating ad metrics, pair this page with [Ads & Monetization](../ads-monetization/).
