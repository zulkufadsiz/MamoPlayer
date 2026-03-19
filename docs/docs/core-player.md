---
title: Core Player API
---

# Core Concepts

`MamoPlayer` is the Core package player component built on top of `react-native-video`.

It gives you:

- A simple playback API with a required `source`
- Optional autoplay via `autoPlay`
- A normalized event stream via `onPlaybackEvent`

In the Core package, `MamoPlayer` is the public component name exported from `@mamoplayer/core`.

# Props

`MamoPlayer` extends most `react-native-video` props and adds Core-specific behavior.

## Required

- `source: MamoPlayerSource`
  - Media source. Accepts a remote URI string, a `{ uri }` object, a local `require()` asset number, or a source array (all shapes supported by `react-native-video`).

## Common Core props

- `autoPlay?: boolean` (default: `true`)
  - Starts playback automatically after `ready`
- `onPlaybackEvent?: (event: PlaybackEvent) => void`
  - Receives normalized playback lifecycle and telemetry events

## Other key exposed props

Because Core props are based on `ReactVideoProps`, you can also pass standard player props such as:

- `resizeMode`
- `repeat`
- `muted`
- `volume`
- `rate`
- `style`
- `testID`

> **Note**: the `controls` prop is **not** forwarded to `react-native-video`. MamoPlayer intercepts it as a `ControlsConfig` object to configure auto-hide behaviour. See the [Core Package docs](/docs/core-package) for the full prop reference.

# Events

`onPlaybackEvent` receives a `PlaybackEvent` object:

```ts
type PlaybackEvent = {
  type:
    | 'ready'
    | 'play'
    | 'pause'
    | 'ended'
    | 'buffer_start'
    | 'buffer_end'
    | 'seek'
    | 'time_update'
    | 'source_type'
    | 'error';
  timestamp: number;
  position: number;
  duration?: number;
  reason?: 'user' | 'auto' | 'programmatic';
  error?: {
    message: string;
    code?: string | number;
  };
};
```

## Event types

- `ready`: media metadata loaded and player is ready
- `play`: playback started
- `pause`: playback paused
- `ended`: playback reached the end
- `buffer_start`: buffering started
- `buffer_end`: buffering finished
- `seek`: playback position changed by seek
- `time_update`: periodic progress update
- `source_type`: source locality resolved; `sourceType` is set to `'streaming'` or `'offline'`
- `error`: playback error with optional error metadata

## Sample event object

```json
{
  "type": "time_update",
  "timestamp": 1766817485123,
  "position": 42.18,
  "duration": 180.0
}
```

# Examples

## Simple Core player with playback event logging

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MamoPlayer, type PlaybackEvent } from '@mamoplayer/core';

export default function CorePlayerScreen() {
  const handlePlaybackEvent = React.useCallback((event: PlaybackEvent) => {
    console.log('[MamoPlayer event]', event.type, event);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MamoPlayer
        source={{ uri: 'https://example.com/video.m3u8' }}
        autoPlay
        resizeMode="contain"
        onPlaybackEvent={handlePlaybackEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
```
