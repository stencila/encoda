/**
 * Defines the Pandoc binary to use: where to get it,
 * where to download it to, how to run it.
 *
 * This is a `.js` file so that it can be run after during
 * `npm install` with no transpilation needed.
 */

const BinWrapper = require('bin-wrapper')
const package = require('../package.json')

const version = package.pandoc.version
const base = `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}`

const binary = new BinWrapper()
  .src(`${base}-linux.tar.gz`, 'linux', 'x64')
  .src(`${base}-macOS.zip`, 'darwin')
  .src(`${base}-windows-i386.zip`, 'win32', 'x32')
  .src(`${base}-windows-x86_64.zip`, 'win32', 'x64')
  .dest('vendor')
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')
  .version(version)

module.exports = binary
