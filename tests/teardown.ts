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

  // Dispite the above, we are still getting
  //  "Jest did not exit one second after the test run has completed."
  // So, until we work out why, in the interests of having tests working
  process.exit(0)
}
