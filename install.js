/**
 * This script is run immediately after this package is installed,
 * or manually using `node install.js`. It downloads any native binaries that
 * to the `vendor` folder.
 */

const BinWrapper = require('bin-wrapper')
const package = require('./package.json')

async function pandoc(version) {
  const base = `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}`
  const bin = new BinWrapper()
    .src(`${base}-linux.tar.gz`, 'linux', 'x64')
    .src(`${base}-macOS.zip`, 'darwin')
    .src(`${base}-windows-i386.zip`, 'win32', 'x32')
    .src(`${base}-windows-x86_64.zip`, 'win32', 'x64')
    .dest('vendor')
    .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')
    .version(version)

  console.log(`Checking for Pandoc ${version} and downloading if necessary`)
  await bin.run(['--version'])
  console.log(`Pandoc ${version} downloaded to ${bin.path()}`)
}

;(async () => {
  await pandoc(package.pandoc.version)
})()
