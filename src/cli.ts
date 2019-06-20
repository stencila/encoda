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
import * as encoda from '.'
import './boot'
import * as puppeteer from './puppeteer'

let { _, ...options } = minimist(process.argv.slice(2), {
  boolean: ['standalone', 'bundle'],
  default: {
    standalone: true,
    bundle: false,
    theme: 'stencila'
  }
})
const name = _[0]
const args = _.slice(1)

// Print log messages to the console.
logga.addHandler((data: logga.LogData) => {
  const level = options.debug ? 4 : 3
  if (data.level < level) {
    console.error(
      `${data.tag} ${logga.LogLevel[data.level].toUpperCase()} ${data.message}`
    )
  }
})

// @ts-ignore
const func = encoda[name]
if (!func) throw new Error(`No such function "${name}"`)

if (name === 'convert') {
  const {
    to,
    from,
    standalone: isStandalone,
    bundle: isBundle,
    theme
  } = options
  options = {
    to,
    from,
    encodeOptions: {
      isStandalone,
      isBundle,
      theme
    }
  }
}

;(async () => {
  // Call the function (which may, or may not be async)
  await func(...args, options)
  // Clean up
  await puppeteer.shutdown()
})()
