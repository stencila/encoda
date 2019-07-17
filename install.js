/**
 * This script is run immediately after this package is installed
 * (or manually using `node install`). It installs any additional,
 * non-NPM, dependencies.
 *
 * This needs to be a `.js` file because `ts-node` is not installed
 * when this package is installed as a dependency.
 */

/* eslint-disable */

;(async () => {
  const pandoc = await load('./src/codecs/pandoc/binary')
  await pandoc.install()
})()

/**
 * A special `require()` function that will load a compiled Javascript
 * module if it exists (in production) but fallback to transpiling Typescript
 * (in development)
 */
async function load(modulePath) {
  try {
    // If this succeeds then we are using
    // a distribution of the package where a `.js`
    // file exists
    return require(modulePath)
  } catch {
    // If we are here, then we are in development
    const path = require('path')
    const distPath = path.resolve(path.join('dist', modulePath))
    try {
      return require(distPath)
    } catch {
      const util = require('util')
      const spawn = util.promisify(require('child_process').spawn)
      await spawn('npx', ['tsc'], {stdio: 'inherit'})
      return require(distPath)
    }
  }
}
