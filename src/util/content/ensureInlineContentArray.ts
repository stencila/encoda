import schema from '@stencila/schema'
import { TxtCodec } from '../../codecs/txt'

/**
 * Ensure that all nodes in an array are `InlineContent` by unwrapping them
 * from within `BlockContent` if necessary.
 */
export const ensureInlineContentArray = (
  nodes:
    | schema.Node
    | schema.Node[]
    | schema.InlineContent[]
    | schema.BlockContent[],
): schema.InlineContent[] => {
  return (Array.isArray(nodes) ? nodes : [nodes]).reduce(
    (prev: schema.InlineContent[], node) => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return schema.isInlineContent(node)
        ? [...prev, node]
        : 'content' in node
          ? [...prev, ...ensureInlineContentArray(node.content)]
          : [...prev, TxtCodec.stringify(node)]
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    },
    [],
  )
}
