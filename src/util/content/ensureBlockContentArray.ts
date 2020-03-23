import * as schema from '@stencila/schema'
import { TxtCodec } from '../../codecs/txt'

/**
 * Ensure that all nodes in an array are `BlockContent`.
 */
export const ensureBlockContentArray = (
  nodes: schema.Node | schema.Node[]
): schema.BlockContent[] => {
  return (Array.isArray(nodes) ? nodes : [nodes]).reduce(
    (prev: schema.BlockContent[], node) => {
      return schema.isBlockContent(node)
        ? [...prev, node]
        : schema.isInlineContent(node)
        ? [...prev, schema.paragraph({ content: [node] })]
        : [...prev, TxtCodec.stringify(node)]
    },
    []
  )
}
