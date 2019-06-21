/**
 * JATS codec
 *
 * Codec for [Journal Article Tag Suite (JATS)](https://en.wikipedia.org/wiki/Journal_Article_Tag_Suite).
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import * as pandoc from '../pandoc'
import * as vfile from '../../vfile'

/**
 * Media types for this codec.
 *
 * There is currently no registered
 * [media type](https://www.iana.org/assignments/media-types/media-types.xhtml)
 * for JATS.
 *
 * This custom type uses the [convention](https://en.wikipedia.org/wiki/XML_and_MIME)
 * of using `application/` and the `+xml` suffix to differentiate this format from other
 * XML-based formats.
 */
export const mediaTypes = ['application/jats+xml']

/**
 * Extension names for this codec.
 */
export const extNames = ['jats']

// TODO: add a `sniff` function that check is a XML files
// and uses regex (for speed) for look for  JATs declaration

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.jats)
}

export const encode: Encode = async (
  node: stencila.Node,
  options = {}
): Promise<vfile.VFile> => {
  return pandoc.encode(node, {
    ...options,
    format: pandoc.OutputFormat.jats,
    codecOptions: { flags: [`--template=jats-template.xml`] }
  })
}
