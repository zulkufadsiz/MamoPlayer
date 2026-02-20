module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['<rootDir>/components/lib/playbackAnalytics.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:react-native|@react-native|expo(?:nent)?|@expo(?:nent)?/.*|expo-.+|@expo-google-fonts/.+|@react-navigation/.+|react-native-safe-area-context|react-native-reanimated|@react-native-community/slider)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
