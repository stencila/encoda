/**
 * The home directory of this application.
 *
 * Directory where it is installed either as a binary, or as a Node package.
 * Used for resolving binaries (eg. `pandoc`) and data
 * (e.g. templates) at runtime.
 *
 * @module util/app/home
 */

import path from 'path'
import isPackaged from './isPackaged'
import isCompiled from './isCompiled'

const home = isPackaged
  ? path.dirname(process.execPath)
  : path.join(__dirname, '..', '..', '..', ...(isCompiled ? ['..'] : []))

export default home
