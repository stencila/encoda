/**
 * @module http
 */

import stencila from '@stencila/schema'
import contentType from 'content-type'
import { load } from '../..'
import { Encode } from '../types'
import * as vfile from '../../util/vfile'
import * as http from '../../util/http'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:http')

/**
 * The media types that this codec can decode/encode.
 *
 * Empty since this codec can only determine the media type
 * from the `Content-Type` header.
 */
export const mediaTypes = []

/**
 * Sniff content to see if it is a HTTP/S URL
 */
export async function sniff(content: string): Promise<boolean> {
  return /^https?:\/\//.test(content)
}

/**
 * Decode a `VFile` with a HTTP URL as content to a Stencila `Node`.
 *
 * Fetches the content and then delegates to the codec specified in the
 * `Content-Type` header.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const url = await vfile.dump(file)
  log.info(`Fetching "${url}"`)
  const response = await http.get(url)
  if (response.statusCode !== 200) {
    log.warn(`When fetching ${url} got status: "${response.statusMessage}"`)
  }
  if (response.fromCache) {
    log.debug(`Fetched from cache "${url}"`)
  }
  const { type: mediaType } = contentType.parse(
    response.headers['content-type'] || ''
  )
  const content = response.body
  return load(content, mediaType)
}

/**
 * It is not possible to encode to a HTTP URL so this
 * function simply throws an error
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  throw new Error(`Unable to encode to HTTP`)
}
