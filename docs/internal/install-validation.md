# Install Validation Plan

Manual validation checklist for confirming published packages install and render correctly in a clean consumer app.

Run this after each release of `@mamoplayer/core` and/or `@mamoplayer/pro`, before announcing the release.

---

## Prerequisites

- Node.js ≥ 18 and npm/yarn available locally
- Xcode (for iOS build verification)
- Android Studio / emulator (for Android build verification)
- npm authenticated for public registry (`npm whoami`)
- GitHub Packages token with `read:packages` scope (for pro install — see `pro-distribution.md`)
- The exact version strings to test (e.g. `1.0.0-rc.1`)

---

## Step 1 — Create a fresh React Native app

Scaffold a new app in a temporary directory **outside** the MamoPlayer repository.

```bash
cd ~/Desktop    # or any scratch location outside the repo
npx @react-native-community/cli@latest init MamoSandbox
cd MamoSandbox
```

Confirm the app runs on at least one platform before adding any packages:

- [ ] `npx react-native run-ios` boots to the default welcome screen
- [ ] (Optional) `npx react-native run-android` boots to the default welcome screen

> **Note:** If you only need to validate one platform, iOS alone is sufficient for this check.

---

## Step 2 — Install peer dependencies

Both packages require the same peer dependencies. Install them first:

```bash
npm install react-native-video@>=6
```

For iOS, link pods after every native package add:

```bash
cd ios && pod install && cd ..
```

- [ ] `react-native-video` installs without peer-dependency warnings
- [ ] `pod install` completes cleanly

---

## Step 3 — Install `@mamoplayer/core` (public npm)

No special registry config is needed for core.

```bash
npm install @mamoplayer/core
```

- [ ] Package resolves from the public npm registry
- [ ] Installed version in `node_modules/@mamoplayer/core/package.json` matches the released version
- [ ] No unexpected peer-dependency conflicts reported
- [ ] `ios/` pod install completes (re-run `cd ios && pod install && cd ..` if core has native deps)

---

## Step 4 — Install `@mamoplayer/pro` (private GitHub Packages)

Create a project-level `.npmrc` in the sandbox app root. **Do not commit** this file:

```ini
@mamoplayer:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Export your token in the shell, then install:

```bash
export GITHUB_TOKEN=<your_read_packages_token>
npm install @mamoplayer/pro
```

- [ ] Package resolves from GitHub Packages (not the public npm registry)
- [ ] Installed version in `node_modules/@mamoplayer/pro/package.json` matches the released version
- [ ] `@mamoplayer/core` is listed as a satisfied peer dependency (no conflict)
- [ ] No source files or internal paths from the MamoPlayer repo are included in the installed package (spot-check `node_modules/@mamoplayer/pro/` — should contain only `dist/`, `README.md`, `package.json`)

---

## Step 5 — Minimal core usage smoke test

Replace the contents of `App.tsx` with the snippet below, then run the app.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MamoPlayer } from '@mamoplayer/core';

const TEST_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function App() {
  return (
    <View style={styles.container}>
      <MamoPlayer
        source={{ uri: TEST_URL }}
        style={styles.player}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  player: { width: '100%', aspectRatio: 16 / 9 },
});
```

- [ ] TypeScript compilation has no errors (`npx tsc --noEmit`)
- [ ] Metro bundler starts without module-resolution errors
- [ ] Player renders on screen (black frame is acceptable; it should not crash)
- [ ] No red error screen on first launch

---

## Step 6 — Minimal pro usage smoke test

> Only run this step if `@mamoplayer/pro` was part of the release.

Replace `App.tsx` with:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProMamoPlayer } from '@mamoplayer/pro';

const TEST_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function App() {
  return (
    <View style={styles.container}>
      <ProMamoPlayer
        source={{ uri: TEST_URL }}
        style={styles.player}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  player: { width: '100%', aspectRatio: 16 / 9 },
});
```

- [ ] TypeScript compilation has no errors (`npx tsc --noEmit`)
- [ ] Metro bundler starts without module-resolution errors
- [ ] Player renders on screen without crashing
- [ ] No red error screen on first launch

---

## Step 7 — Native build verification

Run a full native build (not just Metro) to confirm compiled output links correctly.

**iOS:**

```bash
npx react-native run-ios --configuration Release
```

- [ ] Release build compiles without errors
- [ ] App installs and opens on simulator

**Android** (optional but recommended before major releases):

```bash
npx react-native run-android --variant=release
```

- [ ] Release build compiles without errors

---

## Step 8 — Clean up

```bash
cd ..
rm -rf MamoSandbox
```

Revoke or rotate the `GITHUB_TOKEN` if it was a short-lived CI token.

---

## Results log

Fill in one row per release below.

| Date | Core version | Pro version | iOS | Android | Notes |
|------|-------------|-------------|-----|---------|-------|
| <!-- YYYY-MM-DD --> | | | ⬜ | ⬜ | |

> Symbols: ✅ passed · ❌ failed · ⬜ not tested
