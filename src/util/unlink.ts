/**
 * @module util
 */

import * as stencila from '@stencila/schema'
import transform from './transform'

/**
 * Transform a `Node` by removing any links to local resources.
 *
 * This is used to create documents that do not have the size and clutter
 * of a bundled document, but are also not reliant on local filesystem resources.
 * This can be useful for test snapshots where you don't want the stored file path to
 * be dependant on the document that the machine was generated on.
 *
 * @see bundle
 */
export default async function unlink(
  node: stencila.Node
): Promise<stencila.Node> {
  return transform(
    node,
    async (node: stencila.Node): Promise<stencila.Node> => {
      switch (stencila.nodeType(node)) {
        case 'MediaObject':
        case 'AudioObject':
        case 'ImageObject':
        case 'VideoObject':
          const { contentUrl, ...rest } = node as stencila.MediaObject
          if (
            !contentUrl.startsWith('http') &&
            !contentUrl.startsWith('data:')
          ) {
            return {
              ...rest,
              contentUrl: ''
            }
          }
      }
      return node
    }
  )
}
