/**
 * @module util
 */

import stencila from '@stencila/schema'

/**
 * Get the type of a node
 * @param node The node to get the type for
 */
export default function type(node: stencila.Node): string {
  if (node === null) return 'null'
  if (typeof node === 'boolean') return 'boolean'
  if (typeof node === 'number') return 'number'
  if (typeof node === 'string') return 'string'
  if (Array.isArray(node)) return 'array'
  if (node.type) return node.type
  return typeof node
}
