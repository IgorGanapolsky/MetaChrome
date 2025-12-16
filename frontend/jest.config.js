module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-ng/.*|react-clone-referenced-element|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|@shopify|zustand)',
  ],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/widgets/(.*)$': '<rootDir>/src/widgets/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/theme/(.*)$': '<rootDir>/src/theme/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
};
