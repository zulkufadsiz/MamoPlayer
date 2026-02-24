---
title: Pro Player
---

# Pro Player

The Pro Player extends core playback with premium capabilities such as advanced monetization and enterprise-ready controls.

## Subtitle track defaults and switching

When `tracks.subtitleTracks` is provided, `ProMamoPlayer` resolves the initial subtitle state in this order:

1. `tracks.defaultSubtitleTrackId` (including `"off"`)
2. first subtitle track with `isDefault: true`
3. `"off"`

This means subtitle startup is deterministic even if no explicit default ID is configured.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/content/main.m3u8' }}
  tracks={{
    subtitleTracks: [
      {
        id: 'en',
        language: 'en',
        label: 'English',
        uri: 'https://cdn.example.com/subtitles/en.vtt',
      },
      {
        id: 'tr',
        language: 'tr',
        label: 'Türkçe',
        uri: 'https://cdn.example.com/subtitles/tr.vtt',
        isDefault: true,
      },
    ],
    defaultSubtitleTrackId: 'off',
  }}
/>;
```

At runtime, subtitle selection supports both a concrete track ID and `"off"`.

- Selecting a valid subtitle ID enables that track.
- Selecting `"off"` disables subtitles.

`currentSubtitleTrackId` and `subtitleTracks` are exposed to the player settings layer so a language menu can render and control subtitle state.
