/**
 * Defines the Pandoc binary to use: where to get it,
 * where to download it to, how to run it.
 */

// @ts-ignore
import BinWrapper from 'bin-wrapper'

const pandocVersion = '2.7.2'
const base = `https://github.com/jgm/pandoc/releases/download/${pandocVersion}/pandoc-${pandocVersion}`

export const pandocBinary = new BinWrapper()
  .src(`${base}-linux.tar.gz`, 'linux', 'x64')
  .src(`${base}-macOS.zip`, 'darwin')
  .src(`${base}-windows-i386.zip`, 'win32', 'x32')
  .src(`${base}-windows-x86_64.zip`, 'win32', 'x64')
  .dest('vendor')
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')
  .version(pandocVersion)
