const fs = require('fs');
const path = require('path');

const workspaceRoot = __dirname;
const rootReactNativePath = path.join(workspaceRoot, 'node_modules', 'react-native');
const fallbackReactNativePath = path.join(
  workspaceRoot,
  'packages',
  'core',
  'node_modules',
  'react-native'
);

const reactNativePath = fs.existsSync(path.join(rootReactNativePath, 'package.json'))
  ? rootReactNativePath
  : fallbackReactNativePath;

module.exports = {
  reactNativePath,
  project: {
    ios: {
      sourceDir: './ios',
      automaticPodsInstallation: false,
    },
    android: {
      sourceDir: './android',
      packageName: 'com.mamoplayerandroid',
    },
  },
};
