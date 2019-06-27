/**
 * Get the type of a node
 * @param node The node to get the type for
 */
export default function type(node: any): string {
  if (node === null) return 'null'
  let type = typeof node
  if (type === 'object') {
    if (Array.isArray(node)) return 'array'
    if (node.type) return node.type
  }
  return type
}

/* Make some properties in T required */
// TODO: remove Omit type definition once TypeDoc is upgraded
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>
export type RequireSome<T, K extends keyof T> = Omit<T, K> &
  { [P in K]-?: T[P] }
