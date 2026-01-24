
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/test/setup.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/test/**/*.test.[jt]s?(x)', // Only test files in test/ directory
    '**/test/**/*.spec.[jt]s?(x)', // Only spec files in test/ directory
    '**/*.test.[jt]s?(x)', // Support test files alongside components (e.g., Component.test.tsx)
    '**/*.spec.[jt]s?(x)', // Support spec files
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/test/utils/', // Exclude test utilities
    '/test/fixtures/', // Exclude test fixtures
    '/test/__mocks__/', // Exclude test mocks
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
