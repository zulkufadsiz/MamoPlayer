# MamoPlayer Core Package Guide

This guide explains how to integrate the published core package in a React Native project.

## What is published

The npm package currently exposes only the core entrypoint:

- `mamoplayer/core`

## Requirements

Your app should satisfy these peer dependencies:

- `react` `^19.0.0`
- `react-native` `>=0.81.0`

## Install

```bash
npm install mamoplayer
```

## Import

```ts
import { MamoPlayerCore } from 'mamoplayer/core';
```

You can also import `SimplePlayer` directly:

```ts
import { SimplePlayer } from 'mamoplayer/core';
```

## Minimal usage

```tsx
import React from 'react';
import { View } from 'react-native';
import { MamoPlayerCore } from 'mamoplayer/core';

export default function VideoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MamoPlayerCore
        source={{ uri: 'https://example.com/video.m3u8' }}
        autoPlay={false}
        allowsFullscreen
      />
    </View>
  );
}
```

## Subtitles, quality, and audio tracks

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

## How audio track selection changes video source

`audioTracks` alone only defines labels/options shown in Settings. The actual stream switch happens through language source maps.

Recommended approach: use `qualitySourcesByLanguage` with an `Auto` source per language.

Mapping behavior:

1. User selects an audio track (for example `id: 'tr'`).
2. Player resolves the selected language key from that track id.
3. Player checks `qualitySourcesByLanguage['tr']` first.
4. If quality map exists, selected quality is used; `Auto` acts as the default/base stream.
5. If language-specific quality map is missing, player falls back to `videoSourcesByLanguage['tr']`, then to global `qualitySources` and finally `source`.

So `videoSourcesByLanguage` is optional when `qualitySourcesByLanguage` is fully defined.

Example:

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

## Premium gating behavior

The core player includes premium feature code paths that are gated by `isPremiumUser`.

Default behavior (`isPremiumUser` omitted or `false`):

- Playback analytics disabled
- Subtitle size/style customization hidden
- Resume position persistence disabled
- Media transport integration disabled

Enable premium behavior at runtime:

```tsx
<MamoPlayerCore source={{ uri: 'https://example.com/video.m3u8' }} isPremiumUser />
```

## Core props reference

Most-used props:

- `source`: `VideoSource` (required)
- `autoPlay`: autoplay on ready
- `startAt`: start time in seconds
- `resizeMode`: `'contain' | 'cover' | 'stretch'` (useful for visual comparison/testing)
- `contentFit`: `'contain' | 'cover' | 'fill'`
- `allowsFullscreen`: enable fullscreen button/flow
- `skipSeconds`: skip interval for forward/back controls
- `showSkipButtons`: show/hide skip controls
- `subtitles` / `subtitleTracks`: subtitle data
- `qualitySources` / `qualitySourcesByLanguage`: quality switching sources
- `videoSourcesByLanguage`: language-based source map
- `audioTracks`: explicit audio track labels/options
- `isPremiumUser`: runtime gate for premium-only behavior

## Pro ads quick start

Use `ProMamoPlayer` when you need pre-roll, mid-roll, and post-roll ad breaks.

```ts
type AdsConfig = {
  adBreaks: AdBreak[];
  skipButtonEnabled?: boolean;
  skipAfterSeconds?: number;
};

type AdBreak = {
  type: 'preroll' | 'midroll' | 'postroll';
  time?: number; // set for midroll
  source: {
    uri: string;
    type?: 'video/mp4' | 'application/x-mpegURL';
  };
};
```

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/content/main.mp4' }}
  ads={{
    adBreaks: [
      { type: 'preroll', source: { uri: 'https://cdn.example.com/ads/pre.mp4' } },
      { type: 'midroll', time: 90, source: { uri: 'https://cdn.example.com/ads/mid.mp4' } },
      { type: 'postroll', source: { uri: 'https://cdn.example.com/ads/post.mp4' } },
    ],
    skipButtonEnabled: true,
    skipAfterSeconds: 5,
  }}
  analytics={{
    onEvent: (event) => {
      // ad-related events: ad_start, ad_complete, ad_error
      console.log(event.type, event.position);
    },
  }}
/>
```

Skip behavior:

- `skipButtonEnabled: true` shows the skip UI during ads.
- With `skipAfterSeconds > 0`, UI shows a countdown (`Skip in Ns`) then enables `Skip ad`.

Current limitation: native Google IMA is not integrated yet. Planned roadmap: Phase 3 native IMA support on Android/iOS.

## Notes

- `MamoPlayerCore` always renders the simple player mode.
- `MamoPlayerCore` type is `Omit<MamoPlayerProps, 'playerType'>`.
- If both are provided, `resizeMode` takes precedence over `contentFit` (`fill` maps to `stretch`).
- If you need custom feature access control, set `isPremiumUser` based on your backend entitlement response.
