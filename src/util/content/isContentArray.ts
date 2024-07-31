import {
  Entity,
  InlineContent,
  isBlockContent,
  isInlineContent,
  isPrimitive,
} from '@stencila/schema'

/**
 * Is a node an array of `BlockContent` or `InlineContent` (excluding primitives).
 */
export const isContentArray = (array: any[]): boolean => {
  for (const node of array) {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      !(isBlockContent(node) || (isInlineContent(node) && !isPrimitive(node)))
    )
      return false
  }
  return true
}

/**
 * Is a node an array of `InlineContent` nodes.
 */
export const isInlineContentArray = (
  array: unknown,
): array is InlineContent[] => {
  if (!Array.isArray(array)) return false
  for (const node of array) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!isInlineContent(node)) return false
  }
  return true
}

/**
 * Does a node have a `content` property?
 */
export function hasContent<Type extends Entity & { content?: unknown }>(
  node: Type,
): node is Type & { content: unknown } {
  return node.content !== undefined
}
