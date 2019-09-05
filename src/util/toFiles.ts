/**
 * @module util
 */

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import transform from './transform'
import { toFile } from './uri'

/**
 * Transform a `Node` by writing any media to a file in a specified directory.
 *
 * @param docPath The path of the document
 * @param mediaPath The directory to put media files in
 * @param protocols The URI protocols to write to file e.g. `['file']` for files only
 *
 * @see bundle
 * @see unlink
 */
export async function toFiles(
  node: stencila.Node,
  docPath: string,
  mediaPath: string,
  protocols: string[] = ['data', 'http', 'file']
): Promise<stencila.Node> {
  docPath = path.resolve(docPath)
  mediaPath = path.resolve(mediaPath)

  await fs.ensureDir(mediaPath)
  return transform(
    node,
    async (node: stencila.Node): Promise<stencila.Node> => {
      switch (stencila.nodeType(node)) {
        case 'MediaObject':
        case 'AudioObject':
        case 'ImageObject':
        case 'VideoObject':
          const { contentUrl, ...rest } = node as stencila.MediaObject

          if (contentUrl.startsWith('http')) {
            if (!protocols.includes('http')) return node
          } else if (contentUrl.startsWith('data')) {
            if (!protocols.includes('data')) return node
          } else if (!protocols.includes('file')) return node

          const filePath = path.join(mediaPath, path.basename(contentUrl))
          await toFile(contentUrl, filePath)
          const relPath = path.relative(path.dirname(docPath), filePath)
          return {
            ...rest,
            contentUrl: relPath
          }
      }
      return node
    }
  )
}
