/**
 * @module rpng
 */

import * as schema from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import pngText from 'png-chunk-text'
import pngEncode from 'png-chunks-encode'
import pngExtract, { Chunk } from 'png-chunks-extract'
import zlib from 'zlib'
import bundle from '../../util/bundle'
import { transformSync } from '../../util/transform'
import * as vfile from '../../util/vfile'
import { JsonLdCodec } from '../jsonld'
import { PngCodec } from '../png'
import { Codec, CommonEncodeOptions } from '../types'

/**
 * The keyword to use for the PNG chunk containing the JSON-LD
 */
const KEYWORD = 'JSON-LD'

const jsonLdCodec = new JsonLdCodec()
const pngCodec = new PngCodec()

export class RpngCodec extends Codec implements Codec {
  /**
   * @override Overrides {@link PngCodec.mediaTypes} to provide
   * a vendor media type similar to [image/vnd.mozilla.apng](https://www.iana.org/assignments/media-types/image/vnd.mozilla.apng)
   * for example.
   */
  public readonly mediaTypes = ['image/vnd.stencila.rpng']

  /**
   * @override Overrides {@link PngCodec.extNames} to provide
   * an extension name to match files with this codec.
   */
  public readonly extNames = ['rpng']

  /**
   * Sniff a PNG file to see if it is an RPNG
   *
   * @param source The source to sniff (a file path)
   */
  public readonly sniff = async (source: string): Promise<boolean> => {
    if (path.extname(source) === '.png') {
      if (await fs.pathExists(source)) {
        const contents = await fs.readFile(source)
        return has(contents)
      }
    }
    return false
  }

  /**
   * Decode a RPNG to a Stencila node.
   *
   * This is done by extracting the JSON
   * from the `tEXt` chunk and parsing it.
   *
   * @param file The `VFile` to decode
   * @returns The Stencila node
   */
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const buffer = await vfile.dump(file, 'buffer')
    const jsonLd = extract(buffer)
    return decode(jsonLd, buffer)
  }

  /**
   * Sniff and decode a RPNG to a Stencila node.
   *
   * Combines the `sniff` and `decode` methods.
   * Doing so is more efficient if both operations are needed
   * because the image does not need to be read twice.
   *
   * @param source The source to sniff (a file path)
   * @returns The Stencila node if any, `undefined` otherwise
   */
  public readonly sniffDecode = async (
    source: string
  ): Promise<schema.Node | undefined> => {
    if (path.extname(source) === '.png') {
      if (await fs.pathExists(source)) {
        const buffer = await fs.readFile(source)
        const jsonLd = find(pngExtract(buffer))[1]
        if (jsonLd !== undefined) return decode(jsonLd, buffer)
      }
    }
  }

  /**
   * Encode a Stencila node to a RPNG.
   *
   * @param node The Stencila node to encode
   * @param options Object containing settings for the encoder.
   */
  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    // Special handling for nodes that already have an image as output.
    // For these, we do not want to repeat the image within a chunk
    // within the image. Instead we make it self-referencing.
    let transformed = node
    if (schema.isA('CodeChunk', node)) {
      const { outputs, ...rest } = node
      if (outputs?.length === 1) {
        const output = outputs[0]
        if (schema.isA('ImageObject', output)) {
          const { contentUrl, ...other } = output
          transformed = schema.codeChunk({
            ...rest,
            outputs: [
              schema.imageObject({
                contentUrl: 'data:self',
                ...other
              })
            ]
          })
        }
      }
    }

    // Bundle the node so there are no media resources
    // pointing to local files within the generated JSON-LD
    const bundled = await bundle(transformed)

    // Generate the PNG and get it as a `Buffer`
    const png = await pngCodec.encode(bundled, {
      ...options,
      theme: 'rpng'
    })
    const buffer = await vfile.dump(png, 'buffer')

    // Insert the node as JSON-LD into a chunk
    const jsonLd = await jsonLdCodec.dump(bundled)
    const image = insert(jsonLd, buffer)

    return vfile.load(image)
  }
}

/**
 * Decode the JSON-LD from an image by replacing any `data:self`
 * references in `ImageObject`s with the content to the image
 * itself.
 *
 * This currently does not remove the special `zTXt` chunk from the
 * buffer.
 *
 * @param jsonLd The JSON-LD extracted from the image
 * @param buffer The image buffer
 */
async function decode(jsonLd: string, buffer: Buffer): Promise<schema.Node> {
  const root = await jsonLdCodec.load(jsonLd)
  return transformSync(root, node => {
    if (schema.isA('ImageObject', node)) {
      const { contentUrl } = node
      if (contentUrl === 'data:self') {
        return {
          ...node,
          contentUrl: `data:image/png;base64,${buffer.toString('base64')}`
        }
      }
    }
    return node
  })
}

/**
 * Find a text chunk in an image
 *
 * @param chunks The image chunks to search through
 * @param keyword The keyword for the text chunk
 */
export function find(
  chunks: Chunk[],
  keyword: string = KEYWORD
): [number, string | undefined] {
  let index = 0
  for (const { name, data } of chunks) {
    if (name === 'tEXt' || name === 'zTXt') {
      const entry = name === 'tEXt' ? pngText.decode(data) : ztxtDecode(data)
      if (entry.keyword === keyword) {
        const buffer = Buffer.from(entry.text, 'base64')
        const value = name === 'tEXt' ? buffer : zlib.inflateSync(buffer)
        return [index, value.toString('utf8')]
      }
    }
    index += 1
  }
  return [-1, undefined]
}

/**
 * Does an image have a text chunk with the given keyword?
 *
 * @param image The image `Buffer`
 * @param keyword The keyword for the text chunk
 */
export function has(image: Buffer, keyword: string = KEYWORD): boolean {
  const chunks: Chunk[] = pngExtract(image)
  const text = find(chunks, keyword)[1]
  return text !== undefined
}

/**
 * Extract a text chunk from an image
 *
 * @param image The image `Buffer`
 * @param keyword The keyword for the text chunk
 */
export function extract(image: Buffer, keyword: string = KEYWORD): string {
  const chunks: Chunk[] = pngExtract(image)
  const text = find(chunks, keyword)[1]
  if (text === undefined) throw Error('No chunk found')
  return text
}

/**
 * Insert a text chunk into an image
 *
 * @param text The text to insert
 * @param image The image to insert into
 * @param keyword The keyword for the text chunk
 * @param type The type of chunk to insert
 */
export function insert(
  text: string,
  image: Buffer,
  keyword: string = KEYWORD,
  type: 'tEXt' | 'zTXt' = 'zTXt'
): Buffer {
  const chunks: Chunk[] = pngExtract(image)
  const [index, current] = find(chunks, keyword)
  if (current !== undefined) chunks.splice(index, 1)
  const chunk =
    type === 'tEXt'
      ? pngText.encode(keyword, Buffer.from(text, 'utf8').toString('base64'))
      : ztxtEncode(keyword, zlib.deflateSync(text).toString('base64'))
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}

/**
 * Encode a PNG `zTXt` chunk.
 */
function ztxtEncode(
  keyword: string,
  content: string
): {
  name: string
  data: Buffer
} {
  return {
    name: 'zTXt',
    data: Buffer.concat([
      Buffer.from(keyword, 'utf8'),
      Buffer.alloc(2), // separator and compression
      Buffer.from(content, 'utf8')
    ])
  }
}

/**
 * Decode PNG `zTXt` chunk data.
 */
function ztxtDecode(
  data: Uint8Array | Buffer
): {
  keyword: string
  text: string
} {
  let section = 0
  let text = ''
  let keyword = ''

  for (const code of data) {
    if (section === 0) {
      if (code !== 0) keyword += String.fromCharCode(code)
      else section = 1
    } else if (section === 1) {
      // 1==separator 2==compression
      section = 2
    } else {
      if (code !== 0) text += String.fromCharCode(code)
      else throw new Error('0x00 character is not permitted in xTXt content')
    }
  }

  return { keyword, text }
}
