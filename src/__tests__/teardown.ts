import * as puppeteer from '../puppeteer'

/**
 * Global teardown function that is triggered
 * once after all test suites complete.
 *
 * See https://jestjs.io/docs/en/configuration#globalteardown-string
 */
export default async function teardown() {
  console.log('Running global teardown')
  await puppeteer.shutdown()
}
