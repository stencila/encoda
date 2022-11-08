/**
 * @module util/media/removeDataUris
 */

import schema from '@stencila/schema'
import { transformSync } from '../transform'

/**
 * Transform a `Node` by removing any Data URIs from `MediaObject` nodes.
 *
 * Used in remove Data URIs e.g in test snapshots because they can
 * differ between OS and over time.
 *
 * @see unlinkFiles
 */
export function removeDataUris(node: schema.Node): schema.Node {
  return transformSync(node, (node: schema.Node): schema.Node => {
    if (schema.isIn('MediaObjectTypes', node)) {
      const { contentUrl, ...rest } = node
      if (contentUrl.startsWith('data:')) {
        return {
          ...rest,
          contentUrl: '',
        }
      }
    }
    return node
  })
}
