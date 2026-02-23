# Example App (React Native CLI)

Use `CoreDemoScreen` in a non-Expo React Native app like this.

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
