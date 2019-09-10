import stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:stringify')

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
  if (typeof node === 'object') {
    if ('content' in node) {
      const { content, ...rest } = node
      const properties = Object.keys(rest)
      if (properties.length > 0) {
        log.warn(
          `Node properties ignored when stringifying: ${properties
            .map(prop => `\`${prop}\``)
            .join(', ')}`
        )
      }
      return stringifyContent(content)
    } else {
      log.warn(
        `Node keys ignored when stringifying: ${Object.keys(node)
          .map(key => `\`${key}\``)
          .join(', ')}`
      )
      return stringifyContent(Object.values(node))
    }
  }
  return node.toString()
}
