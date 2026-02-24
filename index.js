import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import CoreDemoScreen from './apps/example/CoreDemoScreen';

AppRegistry.registerComponent(appName, () => CoreDemoScreen);