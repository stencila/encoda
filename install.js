/**
 * This script is run immediately after this package is installed
 * (or manually using `node install`). It installs any additional,
 * non-NPM, dependencies.
 *
 * This needs to be a `.js` file because `ts-node` is not installed
 * when this package is installed as a dependency.
 */

/* eslint-disable */

/**
 * A special `require()` like function that will load a compiled Javascript
 * module if it exists (in production) but fallback to transpiling Typescript
 * (in development).
 *
 * @param modulePath The node module path (NOT filesystem path) i.e. forward slash separated string
 */
async function load(modulePath) {
  try {
    // If this succeeds then we are using
    // a distribution of the package where a
    // compiled Javascript file already exists
    return require(modulePath)
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error

    // If we are here, then we are in development, but
    // the module has not yet been compiled to Javascript.
    // So compile this package and then require the module.
    const childProcess = require('child_process')
    const util = require('util')
    const exec = util.promisify(childProcess.exec)
    await exec('npx tsc -p tsconfig.prod.json')
    return require(modulePath)
  }
}
