import * as schema from '@stencila/schema'
import { TxtCodec } from '../../codecs/txt'

/**
 * Ensure that all nodes in an array are `BlockContent`.
 *
 * If _all_ the nodes in the array are `InlineContent` then will consolidate
 * them into a `Paragraph`. Otherwise, each element is coerced into an `Paragraph`
 * if necessary.
 */
export const ensureBlockContentArray = (
  nodes: schema.Node | schema.Node[]
): schema.BlockContent[] => {
  nodes = Array.isArray(nodes) ? nodes : [nodes]

  if (nodes.every(schema.isInlineContent) === true) {
    return [schema.paragraph({ content: nodes as schema.InlineContent[] })]
  }

  return nodes.reduce((prev: schema.BlockContent[], node: schema.Node) => {
    return schema.isBlockContent(node)
      ? [...prev, node]
      : schema.isInlineContent(node)
      ? [...prev, schema.paragraph({ content: [node] })]
      : [...prev, TxtCodec.stringify(node)]
  }, [])
}

/**
 * Ensure that all nodes in an array are `BlockContent` or if no nodes
 * return `undefined`.
 */
export const ensureBlockContentArrayOrUndefined = (
  nodes: schema.Node[]
): schema.BlockContent[] | undefined => {
  return nodes.length === 0 ? undefined : ensureBlockContentArray(nodes)
}
