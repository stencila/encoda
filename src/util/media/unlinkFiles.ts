/**
 * @module util/media/unlinkFiles
 */

import schema from '@stencila/schema'
import { transformSync } from '../transform'

/**
 * Transform a `Node` by removing any links to local media resources.
 *
 * This is used to create documents that do not have the size and clutter
 * of a bundled document, but are also not reliant on local filesystem resources.
 * This can be useful for test snapshots where you don't want the stored file path to
 * be dependant on the document that the machine was generated on.
 *
 * @see toFiles
 */
export function unlinkFiles(node: schema.Node): schema.Node {
  return transformSync(node, (node: schema.Node): schema.Node => {
    if (schema.isIn('MediaObjectTypes', node)) {
      const { contentUrl, ...rest } = node
      if (!contentUrl.startsWith('http') && !contentUrl.startsWith('data:')) {
        return {
          ...rest,
          contentUrl: '',
        }
      }
    }
    return node
  })
}
