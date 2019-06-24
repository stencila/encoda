/**
 * @module txt
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import type from '../../util/type'
import * as vfile from '../../util/vfile'

/**
 * The media types that this codec can decode/encode.
 */
export const mediaTypes = ['text/plain']

export const extNames = ['txt', 'text']

/**
 * Decode a `VFile` with text content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return await vfile.dump(file)
}

/**
 * Encode a Stencila `Node` to a `VFile` with text content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  const text = ((): string => {
    if (node === null) return 'null'
    switch (type(node)) {
      case 'string':
        return node as string
      default:
        return node.toString()
    }
  })()
  return vfile.load(text)
}
