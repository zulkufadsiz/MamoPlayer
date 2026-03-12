import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import DemoNavigator from './apps/example/DemoNavigator';

AppRegistry.registerComponent(appName, () => DemoNavigator);
