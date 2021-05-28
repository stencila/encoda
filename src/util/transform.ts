/**
 * @module util/transform
 */

import { schema } from '@stencila/jesta'

/**
 * Transform a `Node` by applying a transformer function to
 * each node and its children.
 *
 * This function has three characteristics to be aware of
 *   - recursively traverses **all** nodes, including the nodes
 *     resulting from transformation
 *   - awaits for the result of transformation of each child, in order
 *   - depth first
 *
 * These characteristics make it suitable for doing an "in order" traversal
 * of a node e.g. executing the nodes in a document in the order that they appear.
 * But in some cases it may be better to use a different function e.g. in
 * cases where you wish to traverse all nodes but the order does not matter.
 *
 * @param rootNode The node to transform
 * @param transformer The transforming function. Should return the transformed node.
 * @param recurse If a node is transformed, should transformation be performed on its children?
 */
export default async function transform(
  rootNode: schema.Node,
  transformer: (
    node: schema.Node,
    parent?: schema.Node
  ) => Promise<schema.Node>,
  recurse = false
): Promise<schema.Node> {
  async function walk(
    node: schema.Node,
    parent?: schema.Node
  ): Promise<schema.Node> {
    const transformed = await transformer(node, parent)

    if (
      (transformed !== node && !recurse) ||
      schema.isPrimitive(transformed) ||
      transformed === undefined
    )
      return transformed

    if (Array.isArray(transformed))
      return transformed.reduce(
        async (prev, child) => [
          ...(await prev),
          await walk(child, transformed),
        ],
        Promise.resolve([])
      )

    return Object.entries(transformed).reduce(
      async (prev, [key, child]) => ({
        ...(await prev),
        [key]: await walk(child, transformed),
      }),
      Promise.resolve({})
    )
  }
  return walk(rootNode)
}

/**
 * Synchronous version of `transform`.
 */
export function transformSync(
  node: schema.Node,
  transformer: (node: schema.Node) => schema.Node | undefined
): schema.Node {
  function walk(node: schema.Node): schema.Node | undefined {
    const transformed = transformer(node)

    if (schema.isPrimitive(transformed) || transformed === undefined)
      return transformed

    if (Array.isArray(transformed)) {
      return transformed.reduce((prev, child) => {
        const trans = walk(child)
        return trans !== undefined ? [...prev, trans] : prev
      }, [])
    }

    return Object.entries(transformed).reduce((prev, [key, child]) => {
      const trans = walk(child)
      return trans !== undefined
        ? {
            ...prev,
            [key]: trans,
          }
        : prev
    }, {})
  }
  return walk(node) ?? node
}
