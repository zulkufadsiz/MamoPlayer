# ProMamoPlayer

`ProMamoPlayer` is the advanced player component from `@mamoplayer/pro`.

Use it when your app needs OTT-focused capabilities beyond basic playback, especially:

- analytics instrumentation
- ad monetization (simulated ad breaks or IMA)
- watermark overlays
- playback policy enforcement
- premium theming and layout control

## analytics

`analytics` lets you capture normalized player and ad telemetry (`play`, `pause`, `quartile`, `ad_start`, `ad_complete`, `ad_error`, etc.).

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/movie/master.m3u8' }}
  analytics={{
    sessionId: 'session-2026-02-22-001',
    onEvent: (event) => {
      console.log('[analytics]', event.type, event.position, event.quartile);
    },
  }}
/>;
```

## ads

`ads` configures simulated ad breaks that play as regular video assets (useful for local testing, fallback flows, and demo environments).

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/main-content.mp4' }}
  ads={{
    adBreaks: [
      { type: 'preroll', source: { uri: 'https://cdn.example.com/ads/pre.mp4' } },
      { type: 'midroll', time: 120, source: { uri: 'https://cdn.example.com/ads/mid.mp4' } },
      { type: 'postroll', source: { uri: 'https://cdn.example.com/ads/post.mp4' } },
    ],
    skipButtonEnabled: true,
    skipAfterSeconds: 5,
  }}
/>;
```

## ima

`ima` enables Google IMA/VAST ad serving via an ad tag URL, for production ad decisioning and measurement.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/main-content.mp4' }}
  ima={{
    enabled: true,
    adTagUrl:
      'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&output=vast',
  }}
/>;
```

## watermark

`watermark` adds a visible text overlay for anti-piracy and account traceability.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/premium/master.m3u8' }}
  watermark={{
    text: 'user-42 • example.com',
    opacity: 0.35,
    randomizePosition: true,
    intervalMs: 5000,
  }}
/>;
```

## restrictions

`restrictions` enforces playback policy (for example, blocking forward seek in content windows or capping playback speed).

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/lesson.mp4' }}
  restrictions={{
    disableSeekingForward: true,
    disableSeekingBackward: false,
    maxPlaybackRate: 1.0,
  }}
/>;
```

## theme / themeName

Use `themeName` for built-in themes (`light`, `dark`, `ott`), or `theme` for full token-level customization. If both are provided, `theme` takes precedence.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer source={{ uri: 'https://cdn.example.com/premium/master.m3u8' }} themeName="ott" />;
```

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/premium/master.m3u8' }}
  theme={{
    tokens: {
      colors: {
        background: '#0B1220',
        backgroundOverlay: '#0B1220CC',
        primary: '#7C3AED',
        primaryText: '#F8FAFC',
        secondaryText: '#CBD5E1',
        accent: '#22D3EE',
        danger: '#F43F5E',
        border: '#1E293B',
        sliderTrack: '#64748B',
        sliderThumb: '#22D3EE',
      },
      typography: {
        fontSizeSmall: 12,
        fontSizeMedium: 14,
        fontSizeLarge: 20,
      },
      shape: {
        borderRadiusSmall: 8,
        borderRadiusMedium: 12,
        borderRadiusLarge: 18,
      },
    },
  }}
/>;
```

## layoutVariant

`layoutVariant` switches the controls/UI composition for different viewing contexts.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/premium/master.m3u8' }}
  layoutVariant="ott"
/>;
```

## icons

`icons` lets you override default control icons with your own React components.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';
import { MyPlayIcon, MyPauseIcon } from './player-icons';

<ProMamoPlayer
  source={{ uri: 'https://cdn.example.com/premium/master.m3u8' }}
  icons={{
    Play: MyPlayIcon,
    Pause: MyPauseIcon,
  }}
/>;
```

## Full OTT-style setup

This example combines analytics, simulated ads, watermark, and `themeName="ott"`.

```tsx
import { ProMamoPlayer } from '@mamoplayer/pro';

export function OttPlayerScreen() {
  return (
    <ProMamoPlayer
      source={{ uri: 'https://cdn.example.com/ott/main/master.m3u8' }}
      themeName="ott"
      analytics={{
        sessionId: 'ott-session-001',
        onEvent: (event) => {
          console.log('[OTT analytics]', event.type, {
            position: event.position,
            quartile: event.quartile,
            adPosition: event.adPosition,
          });
        },
      }}
      ads={{
        adBreaks: [
          { type: 'preroll', source: { uri: 'https://cdn.example.com/ads/preroll.mp4' } },
          {
            type: 'midroll',
            time: 180,
            source: { uri: 'https://cdn.example.com/ads/midroll.mp4' },
          },
        ],
        skipButtonEnabled: true,
        skipAfterSeconds: 5,
      }}
      watermark={{
        text: 'subscriber-84 • ott.example.com',
        opacity: 0.3,
        randomizePosition: true,
        intervalMs: 4500,
      }}
    />
  );
}
```
