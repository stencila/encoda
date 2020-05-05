/**
 * @module util
 */

import * as stencila from '@stencila/schema'
import { transformSync } from './transform'

/**
 * Transform an `Entity` node (and all it's descendant entities)
 * by ordering it's properties.
 *
 * The order is designed to be deterministic (i.e. not dependent upon
 * the order properties were defined in code) and human readable
 * (e.g. `type` first, often long `content` last).
 */
export default function orderProperties(node: stencila.Node): stencila.Node {
  return transformSync(
    node,
    (node: stencila.Node): stencila.Node => {
      if (!stencila.isEntity(node)) return node
      const { type, id, meta, content, ...rest } = node as any
      return {
        // The node type and id are always first
        type,
        ...(id === undefined ? {} : { id }),
        // Other attributes in alphabetical order
        ...Object.keys(rest)
          .sort()
          .reduce((prev, curr) => ({ ...prev, ...{ [curr]: rest[curr] } }), {}),
        // Meta data can be long
        ...(meta === undefined ? {} : { meta }),
        // Content is often long and heavily nested so always last
        ...(content === undefined ? {} : { content }),
      }
    }
  )
}
