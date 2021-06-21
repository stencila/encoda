/**
 * @module util/media/toFiles
 */

import schema from '@stencila/schema'
import path from 'path'
import transform from '../transform'
import { toFile } from '../uri'

/**
 * Transform a `Node` by writing any media to a file in a specified directory.
 *
 * If `docPath === undefined`, then no files are written, and the `contentUrl`
 * of each `MediaObject` is set to `#`. This is intended for the case where
 * content is being generated, but is not intended for distribution e.g. during testing.
 *
 * @param docPath The path to the document.
 * @param protocols The URI protocols to write to file e.g. `['file']` for files only
 *
 * @see fromFiles
 * @see unlinkFiles
 */
export async function toFiles(
  node: schema.Node,
  docPath: string,
  protocols: string[] = ['data', 'http', 'file']
): Promise<schema.Node> {
  const docDir = path.dirname(path.resolve(docPath))
  const mediaDir = path.resolve(docPath + '.media')
  let count = 0
  return transform(
    node,
    async (node: schema.Node): Promise<schema.Node> => {
      if (schema.isIn('MediaObjectTypes', node)) {
        const { contentUrl, ...rest } = node

        if (contentUrl.startsWith('http')) {
          if (!protocols.includes('http')) return node
        } else if (contentUrl.startsWith('data')) {
          if (!protocols.includes('data')) return node
        } else if (!protocols.includes('file')) return node

        const filePath = path.join(
          mediaDir,
          contentUrl.startsWith('data')
            ? `${count++}`
            : path.basename(contentUrl)
        )

        await toFile(contentUrl, filePath)
        return {
          ...rest,
          contentUrl: path.relative(docDir, filePath),
        }
      }
      return node
    }
  )
}
