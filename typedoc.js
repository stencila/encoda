module.exports = {
  tsconfig: 'tsconfig.prod.json',
  exclude: [
    '**/__fixtures__/**/*',
    '**/__file_snapshots__/**/*',
    '**/__mocks__/**/*',
    '**/__tests__/**/*',
    '**/**/*.test.ts',
  ],
  includes: '.',
  out: './docs/',
  readme: 'README.md',
}
