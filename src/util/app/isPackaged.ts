/**
 * Is this process being run as a `pkg` packaged binary?
 *
 * @module util/app/isPackaged
 */

import fs from 'fs'
import path from 'path'

const isPackaged =
  (require.main?.id.endsWith('.exe') ||
    Object.prototype.hasOwnProperty.call(process, 'pkg')) &&
  fs.existsSync(path.join('/', 'snapshot'))

export default isPackaged
