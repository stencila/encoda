import stencila, { isBlockContent, isInlineContent } from '@stencila/schema'

/**
 * Ensure that a node is `BlockContent` by wrapping it in a `Paragraph` if necessary.
 */
export const ensureBlockContent = (
  node: stencila.Node
): stencila.BlockContent => {
  return isBlockContent(node)
    ? node
    : { type: 'Paragraph', content: [node].filter(isInlineContent) }
}
