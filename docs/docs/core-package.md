# MamoPlayer Core Package Guide

This guide explains how to integrate the published core package in a React Native project.

## What is published

The npm package currently exposes only the core entrypoint:

- `@mamoplayer/core`

## Requirements

Your app should satisfy these peer dependencies:

- `react` `>=18`
- `react-native` `>=0.72`
- `react-native-video` `>=6`

## Install

```bash
npm install @mamoplayer/core
```

## Import

```ts
import { MamoPlayer } from '@mamoplayer/core';
```

## Minimal usage

```tsx
import React from 'react';
import { View } from 'react-native';
import { MamoPlayer } from '@mamoplayer/core';

export default function VideoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MamoPlayer
        source={{ uri: 'https://example.com/video.m3u8' }}
        autoPlay={false}
      />
    </View>
  );
}
```

## Subtitles, quality, and audio tracks

Track management (quality switching, subtitle tracks, audio tracks) is a **Pro feature** provided by `@mamoplayer/pro` via the `tracks` prop on `ProMamoPlayer`.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://example.com/video.m3u8' }}
  tracks={{
    qualities: [
      { id: 'auto', label: 'Auto', isDefault: true },
      { id: '1080p', label: '1080p', uri: 'https://example.com/video-1080.m3u8' },
      { id: '720p', label: '720p', uri: 'https://example.com/video-720.m3u8' },
    ],
    subtitleTracks: [
      { id: 'en', label: 'English', language: 'en', uri: 'https://example.com/en.vtt' },
    ],
    audioTracks: [
      { id: 'en', label: 'English', language: 'en' },
      { id: 'tr', label: 'Türkçe', language: 'tr' },
    ],
    defaultSubtitleTrackId: 'en',
    defaultAudioTrackId: 'en',
  }}
/>
```

See the [Pro Player docs](./pro-player/) for the full `TracksConfig` API.

## Core props reference

Props specific to `MamoPlayer`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `MamoPlayerSource` | — | **Required.** Video source: URI string, `{ uri }` object, local `require()` asset number, or source array. |
| `autoPlay` | `boolean` | `true` | Begin playback as soon as the player is ready. |
| `paused` | `boolean` | `undefined` | Controlled pause state. |
| `settingsOverlay` | `SettingsOverlayConfig` | — | Configure the built-in settings panel (speed, mute, extra items). |
| `topRightActions` | `ReactNode` | — | Custom content rendered in the top-right overlay slot. |
| `overlayContent` | `ReactNode` | — | Custom content layered over the video. |
| `onFullscreenChange` | `(isFullscreen: boolean) => void` | — | Fires when fullscreen state changes. |
| `onPlaybackEvent` | `(event: PlaybackEvent) => void` | — | Unified playback event callback. See [Playback Events](./core-player.md). |
| `controls` | `ControlsConfig` | — | Auto-hide behaviour for the controls overlay (`autoHide`, `autoHideDelay`). |
| `gestures` | `GesturesConfig` | — | Double-tap seek configuration (±10 s on left/right sides). |
| `timelineConfig` | `{ thumbnailUri?: string }` | — | Forwarded to the scrubber; enables thumbnail frame preview while dragging. |
| `onScrubStart` | `() => void` | — | Called when a scrub gesture begins. |
| `onScrubMove` | `(time: number) => void` | — | Called on every scrub position change with the candidate seek time. |
| `onScrubEnd` | `(time: number) => void` | — | Called when the scrub ends with the final seek time in seconds. |
| `drm` | `DrmConfig` | — | DRM configuration for Widevine (Android/DASH) or FairPlay (iOS/HLS) protected streams. |
| `casting` | `CastingConfig` | — | Casting configuration; shows a cast button and enables AirPlay / Chromecast. |
| `debug` | `DebugConfig` | — | Developer debug overlay. Toggle visibility in-app with a two-finger triple tap. |

All other props from `react-native-video`'s `ReactVideoProps` are forwarded to the underlying `<Video>` component (e.g. `style`, `resizeMode`, `poster`, `volume`, `onReadyForDisplay`).

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
/>;
```

Skip behavior:

- `skipButtonEnabled: true` shows the skip UI during ads.
- With `skipAfterSeconds > 0`, UI shows a countdown (`Skip in Ns`) then enables `Skip ad`.

For IMA-based ad serving (VAST/VMAP), use the `ima` prop on `ProMamoPlayer`. See [Ads & Monetization](./ads-monetization/) for full details.

## Notes

- The public export name is `MamoPlayer`. Import it with `import { MamoPlayer } from '@mamoplayer/core'`.
- The player manages playback rate and mute state internally and exposes them through the settings overlay. Pass `settingsOverlay={{ showPlaybackSpeed: false, showMute: false }}` to hide those controls.
- All quality, subtitle, and audio track management requires `@mamoplayer/pro`. Core only renders the base player with settings (speed/mute) and fullscreen support.
