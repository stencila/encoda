/**
 * @module util/puppeteer
 */

import { getLogger } from '@stencila/logga'
import AsyncLock from 'async-lock'
import path from 'path'
import puppeteer from 'puppeteer'
import isPackaged from './app/isPackaged'

/**
 * The following code is necessary to ensure the Chromium binary can be correctly
 * found when bundled as a binary using [`pkg`](https://github.com/zeit/pkg).
 * See: [`pkg-puppeteer`](https://github.com/rocklau/pkg-puppeteer)
 */

// Adapts the regex path to work on both Windows and *Nix platforms
const pathRegex =
  process.platform === 'win32'
    ? /^.*?\\node_modules\\puppeteer\\\.local-chromium/
    : /^.*?\/node_modules\/puppeteer\/\.local-chromium/

export const executablePath = isPackaged
  ? puppeteer
      .executablePath()
      .replace(
        pathRegex,
        path.join(
          path.dirname(process.execPath),
          'node_modules',
          'puppeteer',
          '.local-chromium'
        )
      )
  : puppeteer.executablePath()

const logger = getLogger('encoda:puppeteer')

let browser: puppeteer.Browser | undefined
const lock = new AsyncLock()

/**
 * Startup the browser if it isn't already.
 *
 * This needs to use a mutex lock to ensure that multiple
 * async calls to startup() don't race to create the
 * singleton browser instance.
 */
export async function startup(): Promise<puppeteer.Browser> {
  return lock.acquire(
    'browser',
    async (): Promise<puppeteer.Browser> => {
      if (typeof browser === 'undefined') {
        logger.debug('Launching new browser')
        browser = await puppeteer.launch({
          executablePath,
          headless: true,
          pipe: true
        })
        logger.debug(`Browser launched. pid: ${browser.process().pid}`)
      }
      return browser
    }
  )
}

/**
 * Create a new page
 */
export async function page(): Promise<puppeteer.Page> {
  const browser = await startup()
  return browser.newPage()
}

/**
 * Close the browser.
 */
export async function shutdown(): Promise<void> {
  await lock.acquire(
    'browser',
    async (): Promise<void> => {
      if (browser) {
        logger.debug(`Closing browser. pid: ${browser.process().pid}`)
        await browser.close()
        logger.debug('Browser closed')
        browser = undefined
      }
    }
  )
}

// Always shutdown before exiting the Node process
// We use `beforeExit` because async operations are not supported
// by `exit`.
// See https://nodejs.org/api/process.html#process_event_beforeexit
process.on('beforeExit', () => {
  shutdown().catch(error => {
    throw error
  })
})
