import puppeteer from 'puppeteer'
import { chromiumPath } from './boot'

/**
 * Get an instance of a Puppeteer web browser `Page`.
 *
 * @returns A thunk that returns the same `puppeteer.Page`
 *          each time that it is called
 */
export function page() {
  let browser: puppeteer.Browser | undefined
  let page: puppeteer.Page | undefined

  /**
   * Startup the browser and create the
   * page if it isn't already.
   */
  async function startup() {
    if (!browser) {
      browser = await puppeteer.launch({
        executablePath: chromiumPath,
        headless: true
      })
    }
    if (!page) {
      page = await browser.newPage()
    }
    return page
  }

  /**
   * Close the browser.
   */
  async function shutdown() {
    if (browser) {
      await browser.close()
      browser = undefined
    }
    page = undefined
  }

  function thunk(): Promise<puppeteer.Page>
  function thunk(close: 'close'): Promise<void>
  function thunk(close?: 'close') {
    return close ? shutdown() : startup()
  }
  return thunk
}
