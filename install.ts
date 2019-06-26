/**
 * This script is run immediately after this package is installed,
 * or manually using `node install.js`. It downloads any native binaries
 * that are required to the `vendor` folder.
 */

import { pandocBinary } from './src/codecs/pandoc/binary'
;(async () => {
  console.log(
    `Checking for Pandoc ${pandocBinary.version()} and downloading if necessary`
  )
  await pandocBinary.run(['--version'])
  console.log(
    `Pandoc ${pandocBinary.version()} has been downloaded to ${pandocBinary.dest()}`
  )
})()
