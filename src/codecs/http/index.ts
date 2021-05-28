/**
 * [[include:src/codecs/http/README.md]]
 *
 * @module codecs/http
 */

import { http } from '@stencila/jesta'
import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import contentType from 'content-type'
import path from 'path'
import { load } from '../..'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const log = getLogger('encoda:http')

export class HTTPCodec extends Codec implements Codec {
  /**
   * Sniff content to see if it is a HTTP/S URL
   */
  public readonly sniff = (content: string): Promise<boolean> => {
    return Promise.resolve(/^https?:\/\//.exec(content) !== null)
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
    if (response.isFromCache) {
      log.debug(`Fetched from cache "${url}"`)
    }

    // Resolve the format of the content
    let format = 'text/plain'
    // Check Content-Type header
    const contentType_ = response.headers['content-type']
    if (contentType_ !== undefined) {
      const { type: mediaType } = contentType.parse(contentType_)
      format = mediaType
    }
    // Because `text/plain` can be used as a default, attempt to
    // override this based on filename extension, e.g. `ipynb`, `Rmd`
    // Note that if extension does not match any of the codecs then
    // the `match()` function will defaul to the `plain `txt` codec anyway.
    if (format === 'text/plain') {
      const extname = path.extname(url).substring(1).toLowerCase()
      if (extname.length > 1) format = extname
    }

    const content = response.body
    return load(content, format)
  }

  /**
   * It is not possible to encode to a HTTP URL so this
   * function simply throws an error
   */
  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Unable to encode to HTTP`)
  }
}
