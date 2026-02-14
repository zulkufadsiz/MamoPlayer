module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:react-native|@react-native|expo(?:nent)?|@expo(?:nent)?/.*|expo-.+|@expo-google-fonts/.+|@react-navigation/.+|react-native-safe-area-context|react-native-reanimated|@react-native-community/slider)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
