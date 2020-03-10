/**
 * @module rpng
 */

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import pngText from 'png-chunk-text'
import pngEncode from 'png-chunks-encode'
import pngExtract, { Chunk } from 'png-chunks-extract'
import * as vfile from '../../util/vfile'
import { PngCodec } from '../png'
import { Codec, CommonEncodeOptions } from '../types'

/**
 * The keyword to use for the PNG chunk containing the JSON-LD
 */
const KEYWORD = 'JSON-LD'

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
        return has(KEYWORD, contents)
      }
    }
    return false
  }

  /**
   * Synchronous version of `sniff()`.
   *
   * @see sniff
   *
   * @param source The source to sniff (a file path)
   */
  public sniffSync = (source: string): boolean => {
    if (path.extname(source) === '.png') {
      if (fs.existsSync(source)) {
        const contents = fs.readFileSync(source)
        return has(KEYWORD, contents)
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
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const buffer = await vfile.dump(file, 'buffer')
    return this.decodeSync(buffer)
  }

  /**
   * Synchronous version of `decode()`.
   *
   * @see decode
   *
   * @param content The content to sniff (a file path).
   */
  public decodeSync = (buffer: Buffer): stencila.Node => {
    const json = extract(KEYWORD, buffer)
    return JSON.parse(json)
  }

  /**
   * Sniff and decode a file if it is a RPNG.
   *
   * This function is like combining `sniffSync()` and `decodeSync()`
   * but is faster because it only reads the file contents once.
   *
   * @param filePath The file path to sniff.
   */
  public sniffDecodeSync = (filePath: string): stencila.Node | undefined => {
    if (path.extname(filePath) === '.png') {
      if (fs.existsSync(filePath)) {
        const image = fs.readFileSync(filePath)
        const chunks: Chunk[] = pngExtract(image)
        const [h, json] = find(KEYWORD, chunks)
        if (json !== undefined) return JSON.parse(json)
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
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    // Generate the PNG and get it as a `Buffer`
    const pngCodec = new PngCodec()
    const png = await pngCodec.encode(node, {
      ...options,
      theme: 'rpng'
    })
    const buffer = await vfile.dump(png, 'buffer')

    // Insert the node as JSON-LD into a `zTXt` chunk
    const json = JSON.stringify(node)
    const image = insert(KEYWORD, json, buffer)

    return vfile.load(image)
  }
}

/**
 * Find a text chunk in an image
 *
 * @param keyword The keyword for the text chunk
 * @param chunks The image chunks to search through
 */
export function find(
  keyword: string,
  chunks: Chunk[]
): [number, string | undefined] {
  let index = 0
  for (const chunk of chunks) {
    if (chunk.name === 'tEXt') {
      const entry = pngText.decode(chunk.data)
      if (entry.keyword === keyword) {
        return [index, Buffer.from(entry.text, 'base64').toString('utf8')]
      }
    }
    index += 1
  }
  return [-1, undefined]
}

/**
 * Does an image have a text chunk with the given keyword?
 *
 * @param keyword The keyword for the text chunk
 * @param image The image `Buffer`
 */
export function has(keyword: string, image: Buffer): boolean {
  const chunks: Chunk[] = pngExtract(image)
  const text = find(keyword, chunks)[1]
  return text !== undefined
}

/**
 * Extract a text chunk from an image
 *
 * @param keyword The keyword for the text chunk
 * @param image The image `Buffer`
 */
export function extract(keyword: string, image: Buffer): string {
  const chunks: Chunk[] = pngExtract(image)
  const text = find(keyword, chunks)[1]
  if (text === undefined) throw Error('No chunk found')
  return text
}

/**
 * Insert a text chunk into an image
 *
 * @param keyword The keyword for the text chunk
 * @param text The text to insert
 * @param image The image to insert into
 */
export function insert(keyword: string, text: string, image: Buffer): Buffer {
  const chunks: Chunk[] = pngExtract(image)
  const [index, current] = find(keyword, chunks)
  if (current !== undefined) chunks.splice(index, 1)
  const chunk = pngText.encode(
    keyword,
    Buffer.from(text, 'utf8').toString('base64')
  )
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}
