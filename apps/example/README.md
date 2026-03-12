# apps/example — MamoPlayer SDK Demo

`apps/example` is the canonical demo surface for the MamoPlayer SDK. It contains two demo screens
and a `DemoNavigator` that lets developers switch between them without editing any files.

## Structure

```
apps/example/
├── DemoNavigator.tsx       ← entry point registered in root index.js
├── CoreDemoScreen.tsx      ← @mamoplayer/core demo
├── CoreDemoScreen.test.tsx
├── ProDemoScreen.tsx       ← @mamoplayer/pro demo
├── ProDemoScreen.test.tsx
├── index.ts                ← re-exports DemoNavigator (default), CoreDemoScreen, ProDemoScreen
└── assets/
    └── .gitkeep
```

## Running the demo

From the repo root:

```bash
npm install

# iOS
npm run start:example

# Android
npm run start:example:android
```

When the app launches you will see the **Demo Home** screen with two cards:

| Card | Package | What it shows |
|--|--|--|
| **Core Demo** | `@mamoplayer/core` | MP4/HLS playback, subtitles, seek controls, playback event log |
| **Pro Demo** | `@mamoplayer/pro` | Ads (pre/mid/post-roll), analytics log, themes, PiP, watermark, tracks |

Tap a card to open that demo. Tap **← Demos** at the top to return to the home screen.

## DemoNavigator

`DemoNavigator` is a zero-dependency, state-machine navigator:

```tsx
import DemoNavigator from './apps/example/DemoNavigator';

AppRegistry.registerComponent(appName, () => DemoNavigator);
```

It manages a single `activeDemo` state (`null | 'core' | 'pro'`). When a demo is chosen it mounts
the screen and passes an `onBack` callback so the back button in the header sends the user home.

## MamoPlayer Core Demo

`CoreDemoScreen` validates the core playback API:

### What this screen shows

- Source selection buttons for MP4, HLS, and an invalid URL test
- A player area using `MamoPlayer` with native controls
- Simple playback controls (play, pause, seek ±10s)
- A `PlaybackOptions` icon row (seek back/forward, settings, fullscreen, PiP)
- Live playback state (`position`, `duration`) and latest event JSON
- Inline error message when playback fails

### How to navigate to it

`DemoNavigator` (the default entry point) handles navigation automatically. Tap the **Core Demo**
card on the home screen. Tap **← Demos** to return.

To use `CoreDemoScreen` standalone in your own navigator, pass an `onBack` prop:

```tsx
import CoreDemoScreen from './apps/example/CoreDemoScreen';

// inside a custom navigator
<CoreDemoScreen onBack={() => navigation.goBack()} />
```

### Features demonstrated

- MP4 and HLS playback (`Play MP4`, `Play HLS`)
- Playback events logging via `onPlaybackEvent` (console + on-screen JSON)
- Seeking with `-10s` / `+10s` buttons
- `PlaybackOptions` integration via `onPressOption` for typed option actions
- Error handling using `Play Invalid Source` and event-based error display

### Quick screen layout (ASCII)

```text
MamoPlayer Core Demo
├─ Source Selection: [Play MP4] [Play HLS] [Play Invalid Source]
├─ Player Area (16:9)
├─ Player Controls: Position / Duration, [Play] [Pause] [-10s] [+10s], [PlaybackOptions Row]
└─ Latest Playback Event: JSON + optional Error message
```

### Screenshot (optional)

Add a screenshot at `apps/example/assets/core-demo.png`, then uncomment the line below:

```md
<!-- ![MamoPlayer Core Demo](./assets/core-demo.png) -->
```

## MamoPlayer Pro Demo

`ProDemoScreen` is the integration testbed for `@mamoplayer/pro` behaviors.

### Navigate to the Pro demo screen

`DemoNavigator` handles navigation automatically. Tap the **Pro Demo** card on the home screen.
Tap **← Demos** to return.

To use `ProDemoScreen` standalone in your own navigator, pass an `onBack` prop:

```tsx
import ProDemoScreen from './apps/example/ProDemoScreen';

// inside a custom navigator
<ProDemoScreen onBack={() => navigation.goBack()} />
```

### What this screen tests

- ProMamoPlayer basic playback
- Analytics logging
- Simulated ads (pre/mid/post)
- Watermark
- Theming + layout variants
- Settings overlay (quality/audio/subtitles)
- Thumbnails on scrub
- PiP toggle
- Error scenarios
