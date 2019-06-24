/**
 * @module json5
 */

import stencila from '@stencila/schema'
import json5 from 'json5'
import { Encode } from '../..'
import * as vfile from '../../util/vfile'

/**
 * The media types that this codec can decode/encode.
 */
export const mediaTypes = ['application/json5']

// The above media type is registered in the `mime` module
// so there is no need to specify `extNames`

/**
 * Decode a `VFile` with JSON5 content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return json5.parse(await vfile.dump(file))
}

/**
 * Encode a Stencila `Node` to a `VFile` with JSON5 content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return vfile.load(json5.stringify(node, null, '  '))
}
