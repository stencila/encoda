module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['jest-expect-message'],
  coveragePathIgnorePatterns: ['tests/helpers.ts']
}
