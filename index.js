import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import ProDemoScreen from './apps/example/ProDemoScreen';

AppRegistry.registerComponent(appName, () => ProDemoScreen);
