/**
 * @module util
 */

import * as stencila from '@stencila/schema'
import produce from 'immer'

/**
 * Transform a `Node` by applying a transformer function to
 * each node an its children.
 *
 * @param node The node to transform
 * @param transformer The transforming function. Should return the transformed node.
 */
export default async function transform(
  node: stencila.Node,
  transformer: (node: stencila.Node, path?: string[]) => Promise<stencila.Node>
): Promise<stencila.Node> {
  async function walk(
    node: stencila.Node,
    path: string[] = []
  ): Promise<stencila.Node> {
    const transformed = await transformer(node, path)
    if (stencila.isPrimitive(transformed) || transformed === undefined) {
      return transformed
    }
    for (const [key, child] of Object.entries(transformed)) {
      // @ts-ignore
      transformed[key] = await walk(child, [...path, key])
    }

    return transformed
  }
  return produce(node, walk)
}
