#!/usr/bin/env node

/**
 * An intentionally simple command line interface to
 * Encoda's main functions.
 *
 * For a more fully featured and easier to use CLI for Encoda
 * see the [`stencila` CLI tool](https://github.com/stencila/stencila).
 *
 * This CLI is intended for developers and those who don't need
 * all the additional functionality in `stencila`. It is kept
 * simple to avoid duplication of CLI code with `stencila` and
 * to avoid bloat in this repo.
 *
 * It it essentially a command line version of a function call. It uses a simple
 * convention of using the first argument to identify the function,
 * subsequent arguments as arguments to the function, and options
 * as an options object to the function.
 *
 * For example,
 *
 * ```bash
 * encoda convert ./article.Rmd ./article.xml --to jats
 * ```
 *
 * is equivalent to the Node.js script,
 *
 * ```js
 * require('@stencila/encoda').convert('./article.Rmd', './article.xml', { to: 'jats'})
 * ```
 *
 * Please see the documentation for each function on the arguments required and
 * options available.
 */
import * as logga from '@stencila/logga'
import minimist from 'minimist'
import { convert } from '.'
import './boot'
import * as puppeteer from './util/puppeteer'

const { _, ...options } = minimist(process.argv.slice(2), {
  boolean: ['standalone', 'bundle', 'debug'],
  default: {
    standalone: true,
    bundle: false,
    theme: 'stencila',
    debug: false
  }
})
const command = _[0]
const args = _.slice(1)

/**
 * Set up logger so that it:
 *
 * - only shows DEBUG entries if --debug=true
 * - does not show duplicate entries unless --debug=true
 */
const log = logga.getLogger('encoda:cli')
const previousLogData = new Set<string>()
logga.replaceHandlers((data: logga.LogData) => {
  if (data.level <= (options.debug ? 3 : 2)) {
    const json = JSON.stringify(data)
    if (options.debug || !previousLogData.has(json)) {
      logga.defaultHandler(data)
      previousLogData.add(json)
    }
  }
})
;(async () => {
  try {
    if (command === 'convert') {
      const { to, from, standalone, bundle, theme, ...rest } = options
      await convert(args[0], args[1], {
        to,
        from,
        encodeOptions: {
          isStandalone: standalone,
          isBundle: bundle,
          theme,
          codecOptions: rest
        }
      })
    } else {
      log.warn(`Ignored unknown command "${command}"`)
    }
  } catch (error) {
    log.error(error)
  } finally {
    await puppeteer.shutdown()
  }
})()
