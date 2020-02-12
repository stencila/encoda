import stencila from '@stencila/schema'

/**
 * Stringify a node or its `content`.
 *
 * This is a convenience function for extracting the content of
 * a node as a string. It is often used in encoding inline content
 * into a plain string as required for some formats. For example, see
 * `gdoc` and `md` codecs.
 */
export const stringifyContent = (node: stencila.Node): string => {
  if (node === undefined) return ''
  if (node === null) return 'null'
  if (Array.isArray(node)) return node.map(stringifyContent).join('')
  if (typeof node === 'object')
    return stringifyContent(
      'content' in node ? node.content : Object.values(node)
    )
  return node.toString()
}
