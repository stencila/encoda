/**
 * This script is run immediately after this package is installed,
 * or manually using `node install.js`. It downloads any native binaries
 * that are required to the `vendor` folder.
 */

const pandoc = require('./src/pandoc-binary')

;(async () => {
  console.log(
    `Checking for Pandoc ${pandoc.version()} and downloading if necessary`
  )
  await pandoc.run(['--version'])
  console.log(
    `Pandoc ${pandoc.version()} has been downloaded to ${pandoc.dest()}`
  )
})()
