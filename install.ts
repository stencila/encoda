/**
 * This script is run immediately after this package is installed,
 * or manually using `npx ts-node install.ts`. It installs any additional,
 * non-NPM, dependencies.
 */

import * as pandoc from './src/codecs/pandoc/binary'
;(async () => {
  await pandoc.install()
})()
