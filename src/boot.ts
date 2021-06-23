/**
 * A module for generating `assets.tgz` at build time and then
 * extracting at runtime when using a `pkg`ed binary.
 *
 * This allows us to bundle executables such as Pandoc and Chromium
 * inside the `encoda` executable.
 */

import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import path from 'path'
import isPackaged from './util/app/isPackaged'
import tar from 'tar'

const log = getLogger('encoda:boot')

if (require.main === module) {
  tar
    .create({ gzip: true }, [
      'dist/codecs/pandoc/binary',
      'dist/codecs/pandoc/templates',
      'node_modules/puppeteer/.local-chromium',
    ])
    .pipe(fs.createWriteStream('assets.tgz'))
}

export function boot(): Promise<void> {
  if (!isPackaged) return Promise.resolve()

  const dest = path.dirname(process.execPath)
  if (fs.existsSync(path.join(dest, 'dist'))) {
    log.debug(`Assets already extracted`)
    return Promise.resolve()
  }

  log.info(`Extracting assets`)
  return tar.extract({
    file: 'assets.tgz',
    cwd: dest,
  })
}
