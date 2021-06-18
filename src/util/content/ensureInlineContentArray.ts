import schema from '@stencila/schema'
import { TxtCodec } from '../../codecs/txt'
import { ensureNodeArray } from './ensureNodeArray'

/**
 * Ensure that all nodes in an array are `InlineContent` by unwrapping them
 * from within `BlockContent` if necessary.
 */
export const ensureInlineContentArray = (
  nodes:
    | schema.Node
    | schema.Node[]
    | schema.InlineContent[]
    | schema.BlockContent[]
): schema.InlineContent[] => {
  return (Array.isArray(nodes) ? nodes : [nodes]).reduce(
    (prev: schema.InlineContent[], node) => {
      return schema.isInlineContent(node)
        ? [...prev, node]
        : 'content' in node
        ? [...prev, ...ensureInlineContentArray(node.content)]
        : [...prev, TxtCodec.stringify(node)]
    },
    []
  )
}
