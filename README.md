# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Node.js version (recommended)

This project is pinned to Node.js 20 using `.nvmrc`.

```bash
nvm use
```

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

### iOS device run (recommended)

For physical iPhone runs, prefer passing the exact UDID:

```bash
npx expo run:ios --device <YOUR_DEVICE_UDID>
```

This avoids interactive device prompt issues that can happen on some Xcode/Node combinations.

## Troubleshooting (iOS)

### `devicectl ... process launch ... exited with non-zero code: 1`

If you see:

- `The process identifier of the launched application could not be determined`

Try, in order:

1. Use Node 20 (`nvm use`).
2. Run with explicit UDID:

   ```bash
   npx expo run:ios --device <YOUR_DEVICE_UDID>
   ```

3. Install missing native dependency used by navigation stacks:

   ```bash
   npx expo install @react-native-masked-view/masked-view
   ```

4. Rebuild:

   ```bash
   npx expo run:ios --device <YOUR_DEVICE_UDID>
   ```

## Playback analytics endpoint (optional)

Playback events (`play`, `pause`, `seek`, `completion`) are logged locally and can also be posted to your backend.

Set this environment variable before starting the app:

```bash
EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT=https://your-api.example.com/playback-events
```

Optional auth token (sent as `Authorization: Bearer <token>`):

```bash
EXPO_PUBLIC_PLAYBACK_ANALYTICS_TOKEN=your-token
```

Optional custom header (for `X-API-Key` style auth):

```bash
EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_NAME=X-API-Key
EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_VALUE=your-api-key
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
