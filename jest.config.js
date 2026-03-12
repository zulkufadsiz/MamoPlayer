// TODO: per-package coverage collection is handled in packages/*/jest.config.js.
// A root-level collectCoverageFrom + coverageThreshold will be wired here once the
// shared analytics helper (components/lib/playbackAnalytics.ts) exists.
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:react-native|@react-native|@react-navigation/.+|react-native-safe-area-context|react-native-reanimated|@react-native-community/slider)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
