/**
 * The directory where this application should
 * store configuration and other data.
 *
 * @module util/app/data
 */

import getAppDataPath from 'appdata-path'
import path from 'path'

const data = path.join(getAppDataPath('stencila'), 'encoda')
export default data
