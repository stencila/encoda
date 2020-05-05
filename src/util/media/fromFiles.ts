/**
 * @module util
 */

import * as schema from '@stencila/schema'
import * as dataUri from '../dataUri'
import transform from '../transform'

/**
 * Transform a `Node` by replacing any links to _local_ media files
 * with data URIs.
 *
 * This is used to create standalone HTML pages
 * as well as when using Puppeteer which does not
 * load local resources for security reasons.
 * See https://github.com/GoogleChrome/puppeteer/issues/1643.
 */
export async function fromFiles(node: schema.Node): Promise<schema.Node> {
  return transform(
    node,
    async (node: schema.Node): Promise<schema.Node> => {
      if (schema.nodeIs(schema.mediaObjectTypes)(node)) {
        const { contentUrl, ...rest } = node
        if (
          contentUrl !== '' &&
          !contentUrl.startsWith('http') &&
          !contentUrl.startsWith('data:')
        ) {
          const data = await dataUri.fromFile(contentUrl)
          return {
            ...rest,
            contentUrl: data.dataUri,
          }
        }
      }
      return node
    }
  )
}
