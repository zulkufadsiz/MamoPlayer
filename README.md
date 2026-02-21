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

## Features (OTT-focused)

- **Adaptive OTT playback baseline** with typed React Native integration.
- **Playback event lifecycle** (`ready`, `play`, `pause`, `seek`, `ended`, buffering, error).
- **Analytics-friendly model** for session and quartile instrumentation (Pro).
- **Visual watermark controls** for anti-piracy UX and content protection flows (Pro).
- **Policy enforcement hooks** for seek and playback-rate restrictions (Pro).
- **Type-safe SDK surface** with bundled `.d.ts` files.

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
