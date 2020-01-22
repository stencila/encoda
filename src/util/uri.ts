/**
 * @module util/uri
 */

import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import tempy from 'tempy'
import { download } from './http'
import * as dataUri from './dataUri'

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
  const extension = path.extname(uri)
  const mediaType = mime.getType(extension) ?? ''
  if (!filePath) filePath = tempy.file({ extension })

  if (dataUri.match(uri)) {
    return dataUri.toFile(uri, filePath)
  } else if (uri.startsWith('http')) {
    await download(uri, filePath)
    return { mediaType, filePath }
  } else {
    if ((await fs.pathExists(uri)) && uri !== filePath)
      await fs.copyFile(uri, filePath)
    return { mediaType, filePath }
  }
}
