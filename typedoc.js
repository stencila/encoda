module.exports = {
  tsconfig: 'tsconfig.prod.json',
  exclude: [
    '**/node_modules/**/*',
    '**/__fixtures__/**/*',
    '**/__file_snapshots__/**/*',
    '**/__mocks__/**/*',
    '**/__tests__/**/*',
    '**/**/*.test.ts',
  ],
  out: './docs/api',
  readme: 'README.md',
}
