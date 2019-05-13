module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/matchers.ts'],
  coveragePathIgnorePatterns: ['tests/helpers.ts'],
  watchPathIgnorePatterns: ['tests/output']
}
