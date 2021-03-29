/**
 * [[include:src/codecs/txt/README.md]]
 *
 * @module codecs/txt
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class TxtCodec extends Codec implements Codec {
  /**
   * Media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['text/plain']

  /**
   * File extension names that this codec will match.
   */
  public readonly extNames = ['txt', 'text']

  /**
   * Decode a `VFile` with text content to a primitive node.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<null | boolean | number | string> => {
    const content = await vfile.dump(file)
    if (content === 'null') return null
    if (content === 'true') return true
    if (content === 'false') return false
    if (/^-?\d+\.?\d*$/.test(content)) return parseFloat(content)
    return content
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with text content.
   *
   * @param node The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (node: stencila.Node): Promise<vfile.VFile> => {
    return Promise.resolve(vfile.load(TxtCodec.stringify(node)))
  }

  /**
   * Encode a Stencila `Node` to a `string`.
   *
   * @param node The Stencila `Node` to encode
   * @returns A string with the text content of the node
   */
  public static readonly stringify = (node: stencila.Node): string => {
    const stringify = (node: stencila.Node): string => {
      if (node === null) return 'null'
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(stringify).join(' ')
      if (typeof node === 'object') {
        if ('content' in node && Array.isArray(node.content))
          return node.content.map(stringify).join('')
        else
          return Object.entries(node).reduce(
            (prev, [key, value]) =>
              key !== 'type'
                ? prev + (prev !== '' ? ' ' : '') + stringify(value)
                : prev,
            ''
          )
      }
      return node.toString()
    }
    return stringify(node)
  }
}
