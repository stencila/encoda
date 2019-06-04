/**
 * Global teardown function that is triggered
 * once after all test suites complete.
 *
 * See https://jestjs.io/docs/en/configuration#globalteardown-string
 */
export default function teardown() {
  console.log('Running global teardown')
  // Emit beforeExit event to close any Puppeteer browsers etc
  process.emit('beforeExit', 0)
}
