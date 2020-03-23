/**
 * @module util
 */

import * as schema from '@stencila/schema'
import { transformSync } from '../transform'
import path from 'path'

/**
 * Transform a `Node` by resolving links to local media resources.
 *
 * This is used to create documents that can be converted to other formats,
 * in other locations, while not breaking those links
 *
 * @see unlinkFiles
 */
export function resolveFiles(node: schema.Node, docPath: string): schema.Node {
  return transformSync(
    node,
    (node: schema.Node): schema.Node => {
      if (schema.nodeIs(schema.mediaObjectTypes)(node)) {
        const { contentUrl, ...rest } = node
        if (!contentUrl.startsWith('http') && !contentUrl.startsWith('data:')) {
          return {
            ...rest,
            contentUrl: path.resolve(path.dirname(docPath), contentUrl)
          }
        }
      }
      return node
    }
  )
}
