module.exports = {
  // Don't use jest-expo preset - it has React 19 compatibility issues
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
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
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/services$': '<rootDir>/src/services/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    __DEV__: true,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
