/**
 * A codec for Reproducible PNGs (rPNG) files.
 *
 * This codec decodes from, and encodes to, a rPNG which embeds the Stencila node
 * into the `tEXt` chunk of the PNG.
 *
 * This has been implemented here to make use of the HTML converter to
 * render the results. It currently using Puppetter and so will not work
 * in the browser. In the future we may use `html2canvas` and `canvas2image` to enable
 * rPNGs to be [generated in the browser](https://medium.com/@danielsternlicht/capturing-dom-elements-screenshots-server-side-vs-client-side-approaches-6901c706c56f).
 *
 * @see http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html#C.Anc-text
 */

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import pngText from 'png-chunk-text'
import pngEncode from 'png-chunks-encode'
import pngExtract, { Chunk } from 'png-chunks-extract'
import punycode from 'punycode'
import { dump, Encode, EncodeOptions } from './index'
import * as puppeteer from './puppeteer'
import type from './util/type'
import { load as loadVFile, VFile, write as writeVFile } from './vfile'

// A vendor media type similar to https://www.iana.org/assignments/media-types/image/vnd.mozilla.apng
// an custom extension to be able to refere to this format more easily.
export const mediaTypes = ['vnd.stencila.rpng']
export const extNames = ['rpng']

/**
 * The keyword to use for the PNG chunk containing the JSON
 */
const KEYWORD = 'JSON'

/**
 * Find a text chunk in an image
 *
 * @param keyword The keyword for the text chunk
 * @param chunks The image chunks to search through
 */
export function find(
  keyword: string,
  chunks: Array<Chunk>
): [number, string | undefined] {
  let index = 0
  for (let chunk of chunks) {
    if (chunk.name === 'tEXt') {
      const entry = pngText.decode(chunk.data)
      if (entry.keyword === keyword) {
        return [index, punycode.decode(entry.text)]
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
  const chunks: Array<Chunk> = pngExtract(image)
  const [index, text] = find(keyword, chunks)
  return text ? true : false
}

/**
 * Extract a text chunk from an image
 *
 * @param keyword The keyword for the text chunk
 * @param image The image `Buffer`
 */
export function extract(keyword: string, image: Buffer): string {
  const chunks: Array<Chunk> = pngExtract(image)
  const [index, text] = find(keyword, chunks)
  if (!text) throw Error('No chunk found')
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
  const chunks: Array<Chunk> = pngExtract(image)
  const [index, current] = find(keyword, chunks)
  if (current) chunks.splice(index, 1)
  const chunk = pngText.encode(keyword, punycode.encode(text))
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}

/**
 * Sniff a PNG file to see if it is an rPNG
 *
 * @param content The content to sniff (a file path)
 */
export async function sniff(content: string): Promise<boolean> {
  if (path.extname(content) === '.png') {
    if (await fs.pathExists(content)) {
      const contents = await fs.readFile(content)
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
 * @param content The content to sniff (a file path)
 */
export function sniffSync(content: string): boolean {
  if (path.extname(content) === '.png') {
    if (fs.existsSync(content)) {
      const contents = fs.readFileSync(content)
      return has(KEYWORD, contents)
    }
  }
  return false
}

/**
 * Decode a rPNG to a Stencila node.
 *
 * This is done by extracting the JSON
 * from the `tEXt` chunk and parsing it.
 *
 * @param file The `VFile` to decode
 * @returns The Stencila node
 */
export async function decode(file: VFile): Promise<stencila.Node> {
  return decodeSync(file)
}

/**
 * Synchronous version of `decode()`.
 *
 * @see decode
 *
 * @param content The content to sniff (a file path).
 */
export function decodeSync(file: VFile): stencila.Node {
  if (Buffer.isBuffer(file.contents)) {
    const json = extract(KEYWORD, file.contents)
    return JSON.parse(json)
  }
  return {}
}

/**
 * Sniff and decode a file if it is a rPNG.
 *
 * This function is like combining `sniffSync()` and `decodeSync()`
 * but is faster because it only reads the file contents once.
 *
 * @param filePath The file path to sniff.
 */
export function sniffDecodeSync(filePath: string): stencila.Node | undefined {
  if (path.extname(filePath) === '.png') {
    if (fs.existsSync(filePath)) {
      const image = fs.readFileSync(filePath)
      const chunks: Array<Chunk> = pngExtract(image)
      const [index, json] = find(KEYWORD, chunks)
      if (json) return JSON.parse(json)
    }
  }
}

// The Puppeteer page that will be used to generate PDFs
export const browser = puppeteer.page()

interface EncodeRPNGOptions {
  fullPage?: boolean
}

/**
 * Encode a Stencila node to a rPNG.
 *
 * This is done by dumping the node to HTML,
 * "screen-shotting" the HTML to a PNG and then inserting the
 * node's JSON into the image's `tEXt` chunk.
 *
 * @param node The Stencila node to encode
 * @param options Object containing settings for the encoder. See type
 * definition for Encode<EncodeRPNGOptions>
 */
export const encode: Encode<EncodeRPNGOptions> = async (
  node: stencila.Node,
  {
    filePath,
    codecOptions = {},
    ...options
  }: EncodeOptions<EncodeRPNGOptions> = {}
): Promise<VFile> => {
  const { fullPage = true } = codecOptions

  // Generate display HTML
  const html = await displayNode(node, {
    ...options,
    codecOptions,
    filePath,
    format: 'html'
  })

  // Generate image of rendered HTML
  const page = await browser()
  // const browser = await puppeteer.launch({
  //   executablePath: chromiumPath
  // })

  await page.setContent(
    `<div id="target" style="${
      fullPage ? '' : 'display: inline-block; padding: 0.1rem'
    }">${html}</div>`,
    {
      waitUntil: 'networkidle0'
    }
  )

  const elem = await page.$('#target')
  if (!elem) throw new Error('Element not found!')

  const buffer = fullPage
    ? await page.screenshot({
        encoding: 'binary',
        fullPage: true
      })
    : await elem.screenshot({
        encoding: 'binary'
      })

  // Insert JSON of the thing into the image
  const json = JSON.stringify(node)
  const image = insert(KEYWORD, json, buffer)

  const file = loadVFile(image)
  if (filePath) {
    file.path = filePath
    await writeVFile(file, filePath)
  }

  return file
}

/**
 *
 */
async function displayNode(
  node: stencila.Node,
  options?: EncodeOptions
): Promise<string> {
  switch (type(node)) {
    case 'string':
      return `<pre>${node as string}</pre>`
    case 'CodeChunk':
      return displayCodeChunk(node as stencila.CodeChunk, options)
    default:
      return dump(node, { ...options, format: 'html' })
  }
}

async function displayCodeChunk(
  chunk: stencila.CodeChunk,
  options?: EncodeOptions
): Promise<string> {
  const outputs = chunk.outputs || []
  const bits = await Promise.all(outputs.map(o => displayNode(o, options)))
  return bits.join('')
}
