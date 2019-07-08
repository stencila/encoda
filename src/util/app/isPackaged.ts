/**
 * Is this process being run as a `pkg` packaged binary?
 *
 * @module util/app/isPackaged
 */

import fs from 'fs'
import path from 'path'

const isPackaged =
  ((process.mainModule && process.mainModule.id.endsWith('.exe')) ||
    process.hasOwnProperty('pkg')) &&
  fs.existsSync(path.join('/', 'snapshot'))

export default isPackaged
