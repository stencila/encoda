/**
 * Defines the Pandoc binary to use for the `pandoc` codec:
 * where to get it, where to download it to, how to run it.
 */

import { getLogger } from '@stencila/logga'
// @ts-ignore
import BinWrapper from 'bin-wrapper'
import fs from 'fs-extra'
import path from 'path'
import isPackaged from '../../util/app/isPackaged'

const version = '2.9.2'
const base = `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}`

/**
 * The folder where the binary is installed
 */
const binaryDir = isPackaged
  ? path.join(
      path.dirname(process.execPath),
      'dist',
      'codecs',
      'pandoc',
      'binary'
    )
  : path.join(__dirname, '..', '..', '..', 'dist', 'codecs', 'pandoc', 'binary')

/**
 * Equivalent to the Pandoc `--data-dir` flag.
 * Instructs Pandoc where to find templates and other assets.
 */
export const dataDir = isPackaged
  ? path.join(path.dirname(process.execPath), 'dist', 'codecs', 'pandoc')
  : __dirname

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
  } catch (err) {
    const error = err as { name?: string }
    if (error?.name === 'InvalidBinaryVersion') {
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
