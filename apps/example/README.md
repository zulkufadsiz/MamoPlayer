# Example App (React Native CLI)

Use `CoreDemoScreen` in a non-Expo React Native app like this.

## MamoPlayer Core Demo

`CoreDemoScreen` is a compact, developer-oriented demo for validating core playback behavior with `@mamoplayer/core`.

### What this screen shows

- Source selection buttons for MP4, HLS, and an invalid URL test
- A player area using `MamoPlayer` with native controls
- Simple playback controls (play, pause, seek ±10s)
- Live playback state (`position`, `duration`) and latest event JSON
- Inline error message when playback fails

### How to navigate to it

If this example app is your main app entry, point `App.tsx` to `CoreDemoScreen`:

```tsx
import CoreDemoScreen from './CoreDemoScreen';

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
- Error handling using `Play Invalid Source` and event-based error display

### Quick screen layout (ASCII)

```text
MamoPlayer Core Demo
├─ Source Selection: [Play MP4] [Play HLS] [Play Invalid Source]
├─ Player Area (16:9)
├─ Player Controls: Position / Duration, [Play] [Pause] [-10s] [+10s]
└─ Latest Playback Event: JSON + optional Error message
```

### Screenshot (optional)

Add a screenshot at `apps/example/assets/core-demo.png`, then uncomment the line below:

```md
<!-- ![MamoPlayer Core Demo](./assets/core-demo.png) -->
```

## 1) `App.tsx`

```tsx
import CoreDemoScreen from './CoreDemoScreen';

export default CoreDemoScreen;
```

## 2) `index.js`

```js
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('MamoPlayer', () => App);
```

If your app name is different, replace `'MamoPlayer'` with your actual native app name.
