# Example App (React Native CLI)

Use `CoreDemoScreen` in a non-Expo React Native app like this.

## MamoPlayer Core Demo

`CoreDemoScreen` is a compact, developer-oriented demo for validating core playback behavior with `@mamoplayer/core`.

### What this screen shows

- Source selection buttons for MP4, HLS, and an invalid URL test
- A player area using `MamoPlayer` with native controls
- Simple playback controls (play, pause, seek ±10s)
- A `PlaybackOptions` icon row (seek back/forward, settings, fullscreen, PiP)
- Live playback state (`position`, `duration`) and latest event JSON
- Inline error message when playback fails

### How to navigate to it

If this example app is your main app entry, point `App.tsx` to `CoreDemoScreen`:

```tsx
import CoreDemoScreen from './apps/example/CoreDemoScreen';

export default CoreDemoScreen;
```

If needed, ensure `index.js` registers your app entry:

```js
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('MamoPlayer', () => App);
```

If your native app name is different, replace `'MamoPlayer'` with your actual app name.

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

## ProMamoPlayer Demo

`ProDemoScreen` is the integration testbed for `@mamoplayer/pro` behaviors in this example app.

### Run the example app

From the repo root:

```bash
npm install
npm run start:example
```

Android:

```bash
npm run start:example:android
```

### Navigate to the Pro demo screen

This example does not include a route/menu switch by default; `App.tsx` decides which demo screen is mounted.
To open the Pro demo, point `App.tsx` to `ProDemoScreen`:

```tsx
import ProDemoScreen from './apps/example/ProDemoScreen';

export default ProDemoScreen;
```

Quick switch between Core and Pro in `App.tsx`:

```tsx
// Core
import DemoScreen from './apps/example/CoreDemoScreen';

// Pro
// import DemoScreen from './apps/example/ProDemoScreen';

export default DemoScreen;
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
