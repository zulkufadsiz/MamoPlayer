# MamoPlayer

MamoPlayer is a React Native video SDK built for OTT products that need production-grade playback, analytics hooks, and monetization-ready UX.

Designed for streaming teams, MamoPlayer helps you ship faster with a stable Core package and premium Pro capabilities for advanced business needs.

## What is MamoPlayer?

MamoPlayer is a modular SDK for mobile streaming apps:

- **MamoPlayer Core** provides reliable playback primitives for React Native.
- **MamoPlayer Pro** adds OTT business features such as analytics events, watermarking, and playback restrictions.

You can start with Core and upgrade to Pro without rewriting your player integration.

## Core vs Pro

| Capability                                 | Core (`@mamoplayer/core`) | Pro (`@mamoplayer/pro`) |
| ------------------------------------------ | ------------------------- | ----------------------- |
| Video playback (React Native Video)        | ✅                        | ✅                      |
| ESM + CJS + TypeScript declarations        | ✅                        | ✅                      |
| Playback event callbacks                   | ✅                        | ✅                      |
| Quartile/session analytics model           | ➖                        | ✅                      |
| Dynamic watermark overlay                  | ➖                        | ✅                      |
| Playback restrictions (seek/rate controls) | ➖                        | ✅                      |

## MamoPlayer Pro Pricing Tiers (Placeholder)

| Tier | Usage | Price | Notes |
| --- | --- | --- | --- |
| Indie | For solo developers | `$[INDIE_PRICE]_one-time` (e.g. `$79`) | Placeholder pricing; adjust before publishing. |
| Team | For small teams (up to `[X]` developers) | `$[TEAM_PRICE]_one-time` (e.g. `$199`) | Placeholder pricing; adjust team size and amount before publishing. |
| Enterprise | For organizations needing custom plans | `Custom` | Includes priority support and potential custom features. |

## Features (OTT-focused)

- **Adaptive OTT playback baseline** with typed React Native integration.
- **Playback event lifecycle** (`ready`, `play`, `pause`, `seek`, `ended`, buffering, error).
- **Analytics-friendly model** for session and quartile instrumentation (Pro).
- **Visual watermark controls** for anti-piracy UX and content protection flows (Pro).
- **Policy enforcement hooks** for seek and playback-rate restrictions (Pro).
- **Type-safe SDK surface** with bundled `.d.ts` files.

### Premium UI & Theming

- Built-in OTT-style theme
- Dark/Light modes
- Customizable tokens for colors/typography/shapes
- Icon override support
- Layout variants for different use cases

```tsx
<ProMamoPlayer
  themeName="ott"
  layoutVariant="ott"
  icons={{ Play: CustomPlayIcon }}
/>
```

## Code example for Core

```tsx
import React from 'react';
import { View } from 'react-native';
import { MamoPlayerCore } from '@mamoplayer/core';

export default function CorePlayerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MamoPlayerCore
        source={{ uri: 'https://cdn.example.com/ott/master.m3u8' }}
        autoPlay
        onPlaybackEvent={(event) => {
          if (event.type === 'error') {
            console.error('Playback error:', event.error?.message);
          }
        }}
      />
    </View>
  );
}
```

## Code example for Pro with Analytics + Watermark

```tsx
import React from 'react';
import { View } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

export default function ProPlayerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ProMamoPlayer
        source={{ uri: 'https://cdn.example.com/ott/premium/master.m3u8' }}
        autoPlay
        analytics={{
          sessionId: 'session-123',
          onEvent: (event) => {
            console.log('Analytics event:', event.type, event.position, event.quartile);
          },
        }}
        watermark={{
          text: 'user-42 • example.com',
          opacity: 0.45,
          randomizePosition: true,
          intervalMs: 4000,
        }}
      />
    </View>
  );
}
```

## Theming & Skins

`ProMamoPlayer` supports two props for styling:

| Prop | Type | Purpose | Priority |
| --- | --- | --- | --- |
| `themeName` | `'light' \| 'dark' \| 'ott'` | Applies one of the built-in themes. | Used when `theme` is not provided. |
| `theme` | `PlayerThemeConfig` | Applies your custom design tokens (colors, typography, shape). | Highest priority (overrides `themeName`). |

If neither prop is provided, Pro uses the default `dark` theme.

### Built-in themes

| Theme | Best for |
| --- | --- |
| `light` | Bright UI surfaces and daytime viewing contexts |
| `dark` | Low-light apps and cinema-style playback |
| `ott` | Streaming-brand style UI with stronger accent emphasis |

### Example: use a built-in theme

```tsx
import React from 'react';
import { View } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

export default function ProDarkThemeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ProMamoPlayer
        source={{ uri: 'https://cdn.example.com/ott/premium/master.m3u8' }}
        themeName="ott"
      />
    </View>
  );
}
```

### Example: pass a custom theme object

```tsx
import React from 'react';
import { View } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

const brandTheme = {
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
      fontFamily: 'System',
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
};

export default function ProCustomThemeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ProMamoPlayer
        source={{ uri: 'https://cdn.example.com/ott/premium/master.m3u8' }}
        theme={brandTheme}
      />
    </View>
  );
}
```

### Theme structure

`PlayerThemeConfig` is token-based and contains three sections:

| Section | Description | Key fields |
| --- | --- | --- |
| `colors` | Visual palette used by overlays and controls | `background`, `backgroundOverlay`, `primary`, `primaryText`, `secondaryText`, `accent`, `danger`, `border`, `sliderTrack`, `sliderThumb` |
| `typography` | Text sizing and optional font family | `fontFamily?`, `fontSizeSmall`, `fontSizeMedium`, `fontSizeLarge` |
| `shape` | Corner radius scale for UI components | `borderRadiusSmall`, `borderRadiusMedium`, `borderRadiusLarge` |

```ts
type PlayerThemeConfig = {
  name?: 'light' | 'dark' | 'ott';
  tokens: {
    colors: {
      background: string;
      backgroundOverlay: string;
      primary: string;
      primaryText: string;
      secondaryText: string;
      accent: string;
      danger: string;
      border: string;
      sliderTrack: string;
      sliderThumb: string;
    };
    typography: {
      fontFamily?: string;
      fontSizeSmall: number;
      fontSizeMedium: number;
      fontSizeLarge: number;
    };
    shape: {
      borderRadiusSmall: number;
      borderRadiusMedium: number;
      borderRadiusLarge: number;
    };
  };
};
```

### Design Guidelines

- Choose colors with strong contrast between `background` and `primaryText`/`secondaryText` to keep controls readable in bright and dark scenes.
- Keep accessibility in mind: test subtitle text, seek labels, and button states against your background and accent colors.
- Recommended sizing baseline: `fontSizeSmall` 12, `fontSizeMedium` 14, `fontSizeLarge` 18-20 for clear TV/mobile readability.
- For an OTT-style feel, use a dark base (`background`), a bold accent (`primary`/`accent`), subtle borders, and medium/large corner radii for modern cards and controls.

## Ad Breaks (Pre-roll, Mid-roll, Post-roll)

`@mamoplayer/pro` supports client-configured ad breaks through the `ads` prop on `ProMamoPlayer`.

### `AdsConfig` format

```ts
type AdsConfig = {
  adBreaks: AdBreak[];
  skipButtonEnabled?: boolean;
  skipAfterSeconds?: number;
};
```

### `AdBreak` format

```ts
type AdBreak = {
  type: 'preroll' | 'midroll' | 'postroll';
  time?: number; // required for midroll; ignored for preroll/postroll
  source: {
    uri: string;
    type?: 'video/mp4' | 'application/x-mpegURL';
  };
};
```

### Example usage

```tsx
import React from 'react';
import { View } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

export default function ProAdsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ProMamoPlayer
        source={{ uri: 'https://cdn.example.com/content/main.mp4' }}
        ads={{
          adBreaks: [
            { type: 'preroll', source: { uri: 'https://cdn.example.com/ads/pre.mp4' } },
            {
              type: 'midroll',
              time: 120,
              source: { uri: 'https://cdn.example.com/ads/mid.m3u8', type: 'application/x-mpegURL' },
            },
            { type: 'postroll', source: { uri: 'https://cdn.example.com/ads/post.mp4' } },
          ],
          skipButtonEnabled: true,
          skipAfterSeconds: 5,
        }}
        analytics={{
          sessionId: 'session-ads-001',
          onEvent: (event) => {
            console.log('analytics', event.type, event.position);
          },
        }}
      />
    </View>
  );
}
```

### Analytics events related to ads

When `analytics.onEvent` is configured, ad playback emits:

- `ad_start`: fired when an ad break starts.
- `ad_complete`: fired when an ad break finishes (including manual skip).
- `ad_error`: fired when ad playback fails and the player resumes main content.

All ad analytics events include the standard analytics shape (`type`, `timestamp`, `position`, optional `duration`, optional `playbackEvent`).

### Skip button behavior

- The skip UI is shown only when `skipButtonEnabled: true`.
- If `skipAfterSeconds` is set and greater than `0`, the button is initially disabled and shows `Skip in Ns`.
- After the countdown reaches `0`, the button switches to `Skip ad`.
- Pressing `Skip ad` ends the active ad break and resumes the main content immediately.

## Native IMA Integration (Phase 3)

Native IMA support is available in `@mamoplayer/pro` through the `ima` prop on `ProMamoPlayer`.

### Requirements

- Use a **custom dev client** or **bare React Native workflow**. **Expo Go is not supported** for native IMA.
- Install and link the **Google IMA SDK** on both Android and iOS.

### Android Gradle setup

In your Android app module (`android/app/build.gradle`), add the ExoPlayer IMA extension dependencies:

```gradle
dependencies {
  implementation "com.google.android.exoplayer:exoplayer-core:2.19.1"
  implementation "com.google.android.exoplayer:extension-ima:2.19.1"
}
```

Then rebuild the app:

```bash
npx react-native run-android
```

### iOS Podfile setup

In your iOS Podfile target, add the Google IMA pod:

```ruby
target 'YourApp' do
  pod 'GoogleAds-IMA-iOS-SDK'
end
```

Install pods and rebuild:

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### ProMamoPlayer example (`ima` config)

```tsx
import React from 'react';
import { View } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

export default function ProNativeIMAScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ProMamoPlayer
        source={{ uri: 'https://cdn.example.com/content/main.mp4' }}
        ima={{
          enabled: true,
          adTagUrl:
            'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&gdfp_req=1&output=vast&env=vp&impl=s&correlator=',
        }}
        ads={{
          adBreaks: [
            { type: 'preroll', source: { uri: 'https://cdn.example.com/ads/fallback-pre.mp4' } },
          ],
        }}
        analytics={{
          sessionId: 'session-ima-001',
          onEvent: (event) => console.log('analytics', event.type, event.position),
        }}
      />
    </View>
  );
}
```

### Runtime behavior

#### When native IMA is used

Native IMA is used when both are true:

- `ima.enabled === true`
- `ima.adTagUrl` is provided

In this mode, ad lifecycle is driven by native IMA events.

#### When simulated ads are used (fallback)

Simulated ad playback (`ads.adBreaks`) is used when:

- `ima` is not configured or not enabled, or
- native IMA fails to load/play ads (for example `loadAds` error or native ad error event)

When native IMA fails at runtime, the player falls back to simulated ads so content playback can continue.

### Known limitations

- Not all ad formats and edge cases may be supported in the initial native IMA rollout.
- Server-side orchestration details (for example advanced VMAP decisioning) depend on your ad backend setup.

### Debugging notes

- Always test on a native runtime (custom dev client or release/debug app), not Expo Go.
- Verify ad tag URL accessibility and validity (VAST response, HTTPS, no geo/network blocking).
- Check native logs for IMA load/playback errors:
  - Android: `adb logcat`
  - iOS: Xcode device logs
- Use `analytics.onEvent` and watch for `ad_start`, `ad_complete`, and `ad_error` events to trace flow.

## Why OTT developers should use it

- **Ship faster:** production-ready player surface instead of custom-building from scratch.
- **Instrument confidently:** event model designed for engagement, QoE, and monetization analytics.
- **Scale cleanly:** start with Core, then enable Pro features as product maturity grows.
- **Stay type-safe:** predictable DX with built-in declaration files and modern package exports.

## Installation instructions

### Prerequisites

- `react` `>=18`
- `react-native` `>=0.72`
- `react-native-video` `>=6`

### Install Core

```bash
yarn add @mamoplayer/core
```

### Install Pro

```bash
yarn add @mamoplayer/pro
```

`@mamoplayer/pro` depends on `@mamoplayer/core`, so installing Pro gives you the Core runtime dependency as well.

## License information

This repository currently does not include a top-level `LICENSE` file.

Until a license file is published, usage rights should be treated as proprietary and governed by your agreement with the MamoPlayer team. For commercial terms or licensing clarification, contact your MamoPlayer representative.
