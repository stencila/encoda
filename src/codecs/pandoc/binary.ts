/**
 * Defines the Pandoc binary to use for the `pandoc` codec:
 * where to get it, where to download it to, how to run it.
 */

import { getLogger } from '@stencila/logga'
// @ts-ignore
import BinWrapper from 'bin-wrapper'
import fs from 'fs-extra'
import path from 'path'
import appHome from '../../util/app/home'
import isCompiled from '../../util/app/isCompiled'

const version = '2.9.2'
const base = `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}`

/**
 * The folder where the binary is to be installed
 */
const binaryDir = path.join(appHome, 'dist', 'codecs', 'pandoc', 'binary')

/**
 * Equivalent to the Pandoc `--data-dir` flag.
 * Instructs Pandoc where to find templates and other assets.
 */
export const dataDir = path.join(
  appHome,
  ...(isCompiled ? ['dist'] : []),
  'src',
  'codecs',
  'pandoc'
)

export const binary = new BinWrapper()
  .src(`${base}-linux-amd64.tar.gz`, 'linux', 'x64')
  .src(`${base}-macOS.zip`, 'darwin')
  .src(`${base}-windows-i386.zip`, 'win32', 'x32')
  .src(`${base}-windows-x86_64.zip`, 'win32', 'x64')
  .dest(binaryDir)
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')
  .version(version)

export const citeprocBinaryPath = path.join(
  binaryDir,
  process.platform === 'win32' ? 'pandoc-citeproc.exe' : 'bin/pandoc-citeproc'
)

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
