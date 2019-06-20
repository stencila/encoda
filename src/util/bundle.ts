import * as stencila from '@stencila/schema'
import produce from 'immer'
import * as dataUri from './dataUri'

/**
 * Walk a document tree and replace any links to local resources
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
  async function walk(node: any) {
    if (node === null || typeof node !== 'object') return node

    switch (node.type) {
      case 'MediaObject':
      case 'AudioObject':
      case 'ImageObject':
      case 'VideoObject':
        const mediaObject = node as stencila.MediaObject
        if (!mediaObject.contentUrl.startsWith('http')) {
          const { dataUri: contentUrl } = await dataUri.fromFile(
            mediaObject.contentUrl
          )
          return {
            ...mediaObject,
            contentUrl
          }
        }
    }

    for (const [key, child] of Object.entries(node)) {
      node[key] = await walk(child)
    }
    return node
  }
  return await produce(node, walk)
}
