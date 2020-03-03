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

// eslint-disable-next-line import/no-named-default
import { default as log, configure } from './log'
import minimist from 'minimist'
import path from 'path'
import { convert, read, write, shutdown } from './index'
// eslint-disable-next-line import/no-named-default
import { default as processNode } from './process'
import { coerce } from './util/coerce'
import { validate } from './util/validate'
import { themes } from '@stencila/thema'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
if (module.parent === null) cli()

async function cli(): Promise<void> {
  const { _, ...options } = minimist(process.argv.slice(2), {
    boolean: ['standalone', 'bundle', 'debug'],
    default: {
      standalone: true,
      bundle: false,
      theme: themes.stencila,
      zip: 'no',
      debug: false
    }
  })
  const command = _[0] ?? ''
  const args = _.slice(1)

  // Configure the log
  configure(options.debug)

  try {
    if (command === 'convert') {
      const { to, from, standalone, bundle, theme, zip, ...rest } = options

      await convert(args[0], args.slice(1), {
        to,
        from,
        encodeOptions: {
          isStandalone: standalone,
          isBundle: bundle,
          shouldZip: zip,
          theme,
          ...rest
        }
      })
    } else if (['process', 'coerce', 'validate'].includes(command)) {
      const input = args[0]
      const output = args[1] ?? input
      const { to, from, standalone, bundle, zip, theme, ...rest } = options
      const node = await read(input, from)
      let processed
      if (command === 'process')
        processed = await processNode(node, path.dirname(input))
      else if (command === 'coerce') processed = await coerce(node)
      else if (command === 'validate') {
        await validate(node)
        processed = node
      } else processed = node
      await write(processed, output, {
        format: to,
        isStandalone: standalone,
        isBundle: bundle,
        shouldZip: zip,
        theme,
        ...rest
      })
    } else {
      log.warn(`Ignored unknown command "${command}"`)
    }
  } catch (error) {
    // Uncaught error: log it and ensure process does not hang.
    log.error(error)
    process.exit(1)
  } finally {
    // Success: graceful exit to ensure process does not hang.
    await shutdown()
    process.exit(0)
  }
}
