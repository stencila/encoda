/**
 * @module http
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import path from 'path'
import contentType from 'content-type'
import { load } from '../..'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const log = getLogger('encoda:http')

export class HTTPCodec extends Codec implements Codec {
  /**
   * Sniff content to see if it is a HTTP/S URL
   */
  public readonly sniff = async (content: string): Promise<boolean> => {
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
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const url = await vfile.dump(file)
    log.info(`Fetching "${url}"`)
    const response = await http.get(url)
    if (response.statusCode !== 200) {
      log.warn(`When fetching ${url} got status: "${response.statusMessage}"`)
    }
    if (response.fromCache) {
      log.debug(`Fetched from cache "${url}"`)
    }
    // Format
    let format = path.extname(url).substring(1).toLowerCase()
    const { type: mediaType } = contentType.parse(
      response.headers['content-type'] || ''
    )
    const content = response.body
    return load(content, format)
  }

  /**
   * It is not possible to encode to a HTTP URL so this
   * function simply throws an error
   */
  public readonly encode = async (): Promise<vfile.VFile> => {
    throw new Error(`Unable to encode to HTTP`)
  }
}
