/**
 * A compiler for Reproducible PNGs (rPNG) files.
 *
 * This compiler parses from, and unparses to, a rPNG which embeds the Stencila node
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
import puppeteer from 'puppeteer'
import { chromiumPath } from './boot'
import { dump, load } from './index'
import { load as loadVFile, read as readVFile, VFile } from './vfile'

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
        return [index, entry.text]
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
  const chunk = pngText.encode(keyword, text)
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}

/**
 * Sniff a PNG file's contents to see if it is an rPNG
 *
 * @param content The file path to sniff
 */
export async function sniff(content: string): Promise<boolean> {
  if (path.parse(content).ext.includes('png')) {
    if (fs.existsSync(content)) {
      const file = await readVFile(content)
      if (Buffer.isBuffer(file.contents)) {
        return has(KEYWORD, file.contents)
      }
    }
  }
  return false
}

/**
 * Parse a rPNG to a Stencila node.
 *
 * This is done by extracting the JSON
 * from the `tEXt` chunk and parsing it.
 *
 * @param file The `VFile` to parse
 * @returns The Stencila node
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  if (Buffer.isBuffer(file.contents)) {
    const json = extract(KEYWORD, file.contents)
    return load(json, 'json')
  }
  return load('{}', 'json')
}

/**
 * Unparse a Stencila node to a rPNG.
 *
 * This is done by dumping the node to HTML,
 * "screen-shotting" the HTML to a PNG and then inserting the
 * node's JSON into the image's `tEXt` chunk.
 *
 * @param node The Stencila node to unparse
 * @param file The `VFile` to unparse to
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  // Generate HTML of the 'value' of the node, which depends on the
  // node type. In the future, we may make this part of the schema definitions
  // and have a `stencila.value()` function to retrieve the value for the node
  // But currently just using this...
  let value: any
  if (node && typeof node === 'object' && node.hasOwnProperty('value')) {
    value = (node as any).value
  } else {
    value = node
  }
  if (!value) throw new Error('Node must have a value')
  let html = await dump(value, 'html')

  // Generate image of rendered HTML
  const browser = await puppeteer.launch({
    executablePath: chromiumPath
  })
  const page = await browser.newPage()
  // TODO Develop CSS for tables etc
  const css = '#target {font: sans #777}'
  // TODO This doesn't actually seem to do anything
  await page.addStyleTag({ content: css })
  await page.setContent(
    `<div id="target" style="display: inline-block; padding: 0.1rem">${html}</div>`,
    { waitUntil: 'networkidle0' }
  )
  const elem = await page.$('#target')
  if (!elem) throw new Error('Element not found!')
  const buffer = await elem.screenshot({
    encoding: 'binary'
  })
  await browser.close()

  // Insert JSON of the thing into the image
  const json = await dump(node, 'json')
  const image = insert(KEYWORD, json, buffer)

  return loadVFile(image)
}
