/**
 * @module util/puppeteer
 */

import { getLogger } from '@stencila/logga'
import AsyncLock from 'async-lock'
import puppeteer from 'puppeteer'
import { chromiumPath } from '../boot'

const logger = getLogger('encoda:puppeteer')

let browser: puppeteer.Browser | undefined
var lock = new AsyncLock()

/**
 * Startup the browser if it isn't already.
 *
 * This needs to use a mutex lock to ensure that multiple
 * async calls to startup() don't race to create the
 * singleton browser instance.
 */
export async function startup(): Promise<puppeteer.Browser> {
  return await lock.acquire('browser', async () => {
    if (typeof browser === 'undefined') {
      logger.debug('Launching new browser')
      browser = await puppeteer.launch({
        executablePath: chromiumPath,
        headless: true
      })
      logger.debug(`Browser launched. pid: ${browser.process().pid}`)
    }
    return browser
  })
}

/**
 * Create a new page
 */
export async function page(): Promise<puppeteer.Page> {
  const browser = await startup()
  return await browser.newPage()
}

/**
 * Close the browser.
 */
export async function shutdown(): Promise<void> {
  await lock.acquire('browser', async () => {
    if (browser) {
      logger.debug(`Closing browser. pid: ${browser.process().pid}`)
      await browser.close()
      logger.debug('Browser closed')
      browser = undefined
    }
  })
}

// Always shutdown before exiting the Node process
// We use `beforeExit` because async operations are not supported
// by `exit`.
// See https://nodejs.org/api/process.html#process_event_beforeexit
process.on('beforeExit', shutdown)
