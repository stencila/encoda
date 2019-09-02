/**
 * Defines the Pandoc binary to use for the `pandoc` codec:
 * where to get it, where to download it to, how to run it.
 */

import { getLogger } from '@stencila/logga'
// @ts-ignore
import BinWrapper from 'bin-wrapper'
import fs from 'fs-extra'
import path from 'path'
import home from '../../util/app/home'
import isPackaged from '../../util/app/isPackaged'

const version = '2.7.3'
const base = `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}`

export const binary = new BinWrapper()
  .src(`${base}-linux.tar.gz`, 'linux', 'x64')
  .src(`${base}-macOS.zip`, 'darwin')
  .src(`${base}-windows-i386.zip`, 'win32', 'x32')
  .src(`${base}-windows-x86_64.zip`, 'win32', 'x64')
  .dest(path.join(home, 'vendor', 'pandoc'))
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')
  .version(version)

/**
 * Equivalent to the Pandoc `--data-dir` flag.
 * Instructs Pandoc where to find templates and other assets.
 */
export const dataDir = isPackaged
  ? path.join(home, 'codecs', 'pandoc')
  : __dirname

/**
 * Install the Pandoc binary if it is not already
 * in it's expected location.
 */
export async function install(): Promise<void> {
  const log = getLogger('encoda:pandoc')
  log.info(
    `Checking for Pandoc ${binary.version()} and downloading if necessary`
  )
  await fs.ensureDir(path.dirname(binary.dest()))
  try {
    // Try to run the binary
    await binary.run()
  } catch (error) {
    if (error.name === 'InvalidBinaryVersion') {
      // Incorrect version, so remove it, and try again
      log.info(`Removing previous version of Pandoc`)
      await fs.remove(binary.dest())
      await binary.run()
    } else {
      throw error
    }
  }
  log.info(`Pandoc ${binary.version()} is available at ${binary.dest()}`)
}
