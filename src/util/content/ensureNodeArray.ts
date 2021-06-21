import schema from '@stencila/schema'

/**
 * Ensure that a value is an array of `Node`s
 * (by wrapping non-arrays into an array).
 */
export const ensureNodeArray = (
  nodes: schema.Node | schema.Node[]
): schema.Node[] => (Array.isArray(nodes) ? nodes : [nodes])
