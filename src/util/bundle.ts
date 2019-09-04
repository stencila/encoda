/**
 * @module util
 */

import * as stencila from '@stencila/schema'
import * as dataUri from './dataUri'
import transform from './transform'
/**
 * Transform a `Node` by replacing any links to local resources
 * with data URIs.
 *
 * This is used to create standalone HTML pages
 * as well as when using Puppeteer which does not
 * load local resources for security reasons.
 * See https://github.com/GoogleChrome/puppeteer/issues/1643.
 *
 * Currently only handles `MediaObject` nodes, but could be used for other
 * node types in the future.
 */
export default async function bundle(
  node: stencila.Node
): Promise<stencila.Node> {
  return transform(
    node,
    async (node: stencila.Node): Promise<stencila.Node> => {
      switch (stencila.nodeType(node)) {
        case 'MediaObject':
        case 'AudioObject':
        case 'ImageObject':
        case 'VideoObject':
          const { contentUrl, ...rest } = node as stencila.MediaObject
          if (!contentUrl.startsWith('http') && !contentUrl.startsWith('data:')) {
            const data = await dataUri.fromFile(contentUrl)
            return {
              ...rest,
              contentUrl: data.dataUri
            }
          }
      }
      return node
    }
  )
}
