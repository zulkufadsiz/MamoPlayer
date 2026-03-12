---
title: Changelog
---

# Changelog

Track notable changes, fixes, and release highlights for MamoPlayer documentation and SDK behavior.

## Planned / Deferred (not yet shipped)

The following items are scoped and designed but intentionally deferred past the 1.0.0 release candidate.
They will be completed in a subsequent patch or minor release.

### Pro Player — Subtitle track imperative API

Internal subtitle track management is fully implemented (startup selection, settings-menu switching, `textTracks` / `selectedTextTrack` wired to `react-native-video`, custom cue overlay in fullscreen). What remains is surfacing control to consumers as a programmatic API:

- Convert `ProMamoPlayer` from `React.FC` to `React.forwardRef` and define a `ProMamoPlayerRef` handle that exposes:
  - `changeSubtitleTrack(subtitleTrackId: string | "off")`
  - `currentSubtitleTrackId` (read-only)
