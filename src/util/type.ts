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

/* Make some properties in T required */
// TODO: remove Omit type definition once TypeDoc is upgraded
// eslint-disable-next-line
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>
export type RequireSome<T, K extends keyof T> = Omit<T, K> &
  { [P in K]-?: T[P] }
