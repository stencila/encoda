import { isBlockContent, isInlineContent, isPrimitive } from '@stencila/schema'

/**
 * Is a node an array of `BlockContent` or `InlineContent` (excluding primitives).
 */
export const isContentArray = (array: any[]): boolean => {
  for (const node of array) {
    if (
      !(isBlockContent(node) || (isInlineContent(node) && !isPrimitive(node)))
    )
      return false
  }
  return true
}
