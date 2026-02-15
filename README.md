# MamoPlayer

React Native/Expo video player package with customizable UI and language/quality-aware source handling.

## Install

```bash
npm install mamoplayer
```

## Import

```ts
import { MamoPlayerCore } from 'mamoplayer/core';
```

## Quick Start

```tsx
import React from 'react';
import { View } from 'react-native';
import { MamoPlayerCore } from 'mamoplayer/core';

export default function Screen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
      <MamoPlayerCore
        source={{ uri: 'https://example.com/video/master.m3u8' }}
        title="Sample Video"
        allowsFullscreen
      />
    </View>
  );
}
```

## Main Props

- `source`: Primary video source.
- `videoSourcesByLanguage`: Language-keyed sources (example keys: `en`, `tr`, `es`).
- `qualitySources`: Global quality map (example keys: `Auto`, `1080p`, `720p`).
- `qualitySourcesByLanguage`: Language + quality map.
- `audioTracks`: Audio track definitions shown in settings.
- `subtitleTracks`: Subtitle track definitions shown in settings.
- `defaultAudioTrackId`, `defaultSubtitleTrackId`: Initial selected tracks.
- `allowsFullscreen`: Player capability.
- `title`, `author`, `artwork`: Metadata used by UI/transport integration.

## Language and Quality Selection

- If `qualitySourcesByLanguage` is provided, the player resolves quality options from the selected language first.
- If language-specific quality is missing, it falls back to `qualitySources` when available.
- If no matching quality is found, it falls back to the base `source`.
- `Auto` quality is supported as a normal quality key.

## TypeScript

Type declarations are published with the package. You get autocomplete and prop types directly from:

```ts
import { MamoPlayerCore } from 'mamoplayer/core';
```

## Developer Guide

### Package Surface

Published entrypoint:

- `mamoplayer/core`

You can import either the full core wrapper or the simple player directly:

```ts
import { MamoPlayerCore, SimplePlayer } from 'mamoplayer/core';
```

### Requirements

Recommended peer dependency baseline:

- `expo` `^54.0.0`
- `react` `^19.0.0`
- `react-native` `>=0.81.0`

### Subtitles, Quality, and Audio Example

```tsx
<MamoPlayerCore
  source={{ uri: 'https://example.com/video-default.m3u8' }}
  qualitySources={{
    Auto: { uri: 'https://example.com/video-auto.m3u8' },
    '1080p': { uri: 'https://example.com/video-1080.m3u8' },
    '720p': { uri: 'https://example.com/video-720.m3u8' },
  }}
  subtitleTracks={[
    {
      id: 'en',
      label: 'English',
      language: 'en',
      subtitles: [
        { start: 0, end: 2, text: 'Hello' },
        { start: 2, end: 4, text: 'Welcome' },
      ],
    },
  ]}
  audioTracks={[
    { id: 'en', label: 'English', language: 'en' },
    { id: 'tr', label: 'Türkçe', language: 'tr' },
  ]}
  defaultSubtitleTrackId="en"
  defaultAudioTrackId="en"
/>
```

### Audio Selection and Source Resolution

`audioTracks` defines labels/options shown in settings. Actual stream switching is resolved through source maps.

Recommended setup: provide `qualitySourcesByLanguage` with an `Auto` source per language.

Resolution order:

1. Use selected audio/subtitle language key.
2. Check `qualitySourcesByLanguage[languageKey]`.
3. If missing, check `videoSourcesByLanguage[languageKey]`.
4. If still missing, fallback to global `qualitySources`.
5. Final fallback is base `source`.

```tsx
<MamoPlayerCore
  source={{ uri: 'https://example.com/default.m3u8' }}
  audioTracks={[
    { id: 'en', label: 'English', language: 'en' },
    { id: 'tr', label: 'Türkçe', language: 'tr' },
  ]}
  qualitySourcesByLanguage={{
    en: {
      Auto: { uri: 'https://example.com/en/auto.m3u8' },
      '720p': { uri: 'https://example.com/en/720.m3u8' },
    },
    tr: {
      Auto: { uri: 'https://example.com/tr/auto.m3u8' },
      '720p': { uri: 'https://example.com/tr/720.m3u8' },
    },
  }}
/>
```

### Core Props Reference

Most-used props:

- `source` (required)
- `autoPlay`
- `startAt`
- `contentFit`: `'contain' | 'cover' | 'fill'`
- `allowsFullscreen`
- `skipSeconds`
- `showSkipButtons`
- `subtitles` / `subtitleTracks`
- `qualitySources` / `qualitySourcesByLanguage`
- `videoSourcesByLanguage`
- `audioTracks`

### Notes

- `MamoPlayerCore` renders simple player mode.
- `MamoPlayerCore` type is `Omit<MamoPlayerProps, 'playerType'>`.
