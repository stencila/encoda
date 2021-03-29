/**
 * @module util/media/resolveFiles
 */

import * as schema from '@stencila/schema'
import fs from 'fs'
import path from 'path'
import { transformSync } from '../transform'

/**
 * Transform a `Node` by resolving all links to local media resources.
 *
 * Any `contentUrl` of `MediaObject` nodes that point to files
 * are converted to absolute paths for their in memory representation.
 * Later, when encoding to another format, these paths are are made relative
 * by the `toFiles` function.
 *
 * @see unlinkFiles
 * @see toFiles
 */
export function resolveFiles(node: schema.Node, docPath: string): schema.Node {
  return transformSync(
    node,
    (node: schema.Node): schema.Node => {
      if (schema.nodeIs(schema.mediaObjectTypes)(node)) {
        const { contentUrl, ...rest } = node
        if (!contentUrl.startsWith('http') && !contentUrl.startsWith('data:')) {
          let resolvedPath
          if (path.isAbsolute(contentUrl)) {
            // Already absolute, no need to do anything
            resolvedPath = contentUrl
          } else if (fs.existsSync(contentUrl)) {
            // Path is relative to the cwd, so make it absolute
            resolvedPath = path.resolve(contentUrl)
          } else {
            // Path could be relative to the document, so try that
            // as a last resort
            resolvedPath = path.resolve(path.dirname(docPath), contentUrl)
          }
          return {
            ...rest,
            contentUrl: resolvedPath,
          }
        }
      }
      return node
    }
  )
}
