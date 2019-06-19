import * as puppeteer from '../src/puppeteer'

/**
 * Global teardown function that is triggered
 * once after all test suites complete.
 *
 * See https://jestjs.io/docs/en/configuration#globalteardown-string
 */
export default function teardown() {
  puppeteer.shutdown()
}
