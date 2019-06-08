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
import minimist from 'minimist'
import * as encoda from '.'
import './boot'

const { _, ...options } = minimist(process.argv.slice(2), {
  boolean: ['fullPage'],
  default: {
    fullPage: true
  }
})
const name = _[0]
const args = _.slice(1)

// @ts-ignore
const func = encoda[name]
if (!func) throw new Error(`No such function "${name}"`)
;(async () => {
  // Call the function (which may, or may not be async) and then
  await func(...args, options)
  // Exit the process (necessary in case there are Puppeteer
  // instances open etc
  process.exit(0)
})()
