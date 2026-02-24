---
title: Changelog
---

# Changelog

Track notable changes, fixes, and release highlights for MamoPlayer documentation and SDK behavior.

## Unreleased (2026-02-24)

### Pro Player

- Added deterministic startup selection for `tracks.subtitleTracks` in `ProMamoPlayer`:
  - `tracks.defaultSubtitleTrackId`
  - first track with `isDefault: true`
  - fallback to `"off"`
- Added explicit subtitle runtime switching support with `changeSubtitleTrack(subtitleTrackId: string | "off")`.
- Wired subtitle state to the underlying player (`textTracks` / `selectedTextTrack`), including proper disable behavior when `"off"` is selected.
- Exposed `currentSubtitleTrackId` and `subtitleTracks` to the settings layer for subtitle language menu rendering.
