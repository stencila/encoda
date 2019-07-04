/**
 * @module util/uri
 */

import fs from 'fs-extra'
import * as dataUri from './dataUri'
import mime from 'mime'
import { getLogger } from '@stencila/logga'
import tempy from 'tempy'
import path from 'path'

const log = getLogger('encoda:util')

/**
 * Write a URI to file
 *
 * @param uri The URI to write.
 * @param filePath The path of the file to write to (defaults to a temporary file)
 */
export async function toFile(
  uri: string,
  filePath?: string
): Promise<{ mediaType: string; filePath: string }> {
  if (dataUri.match(uri)) {
    return await dataUri.toFile(uri, filePath)
  } else if (uri.startsWith('http')) {
    log.error('TODO: storage of remote resources not implemented')
    return { mediaType: '', filePath: '' }
  } else {
    const extension = path.extname(uri)
    const mediaType = mime.getExtension(extension) || ''
    if (!filePath) filePath = tempy.file({ extension })
    if (fs.pathExists(uri) && uri !== filePath) await fs.copyFile(uri, filePath)
    return { mediaType, filePath }
  }
}
