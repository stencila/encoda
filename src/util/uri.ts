/**
 * @module util/uri
 */

import mime from 'mime'
import path from 'path'
import tempy from 'tempy'
import * as dataUri from './dataUri'
import { http } from '@stencila/jesta'
import { copyFile } from './media/copyFile'

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
  if (filePath === undefined) filePath = tempy.file({ extension })

  if (dataUri.match(uri)) {
    return dataUri.toFile(uri, filePath)
  } else if (uri.startsWith('http')) {
    await http.download(uri, filePath)
  } else {
    await copyFile(uri, filePath)
  }
  return { mediaType, filePath }
}
