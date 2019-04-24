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
 */

import * as stencila from '@stencila/schema'
import path from 'path'
// @ts-ignore
import { default as pngText } from 'png-chunk-text'
// @ts-ignore
import { default as pngEncode } from 'png-chunks-encode'
// @ts-ignore
import { default as pngExtract } from 'png-chunks-extract'
import puppeteer from 'puppeteer'
import { isBuffer } from 'util'
import { dump, load } from './index'
import { load as loadVFile, VFile } from './vfile'

export const mediaTypes = [
  // A vendor media type similar to https://www.iana.org/assignments/media-types/image/vnd.mozilla.apng
  'vnd.stencila.rpng'
]

export const extNames = [
  // To be able to refer to this compiler since the `mime` package
  // does not have registered extension names for the above media type
  'rpng'
]

type Dict = { [key: string]: unknown }

/**
 * The keyword to use for the PNG chunk containing the JSON
 */
const KEYWORD = 'JSON'

/**
 * Find the embedded JSON within image chunks
 *
 * @param chunks The image chunks to search through
 */
export function find(chunks: Array<Dict>): [number, string | undefined] {
  let index = 0
  for (let chunk of chunks) {
    if (chunk.name === 'tEXt') {
      const entry = pngText.decode(chunk.data)
      if (entry.keyword === KEYWORD) {
        return [index, entry.text]
      }
    }
    index += 1
  }
  return [-1, undefined]
}

/**
 * Extract an embedded node from within an image
 *
 * @param image The image `Buffer`
 */
export function extract(image: Buffer): Dict {
  const chunks: Array<Dict> = pngExtract(image)
  const [index, json] = find(chunks)
  if (!json) throw Error('No chunk found')
  return JSON.parse(json)
}

/**
 * Insert a node into an image
 *
 * @param node The Javascript object to insert
 * @param image The image to insert into
 */
export function insert(node: Dict, image: Buffer): Buffer {
  const json = JSON.stringify(node)
  const chunks: Array<Dict> = pngExtract(image)
  const [index, current] = find(chunks)
  if (current) chunks.splice(index, 1)
  const chunk = pngText.encode(KEYWORD, json)
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}

/**
 * Sniff a PNG file's contents to see if it is an rPNG
 *
 * @param filePath The file path to sniff
 */
export function sniff(filePath: string): boolean {
  return path.parse(filePath).ext.includes('png')
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
  if (isBuffer(file.contents)) {
    const json = extract(file.contents)
    return load(JSON.stringify(json), 'json')
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
    value = (node as any).toString()
  }
  if (!value) throw new Error('Node must have a value')
  let html = await dump(value, 'html')

  // Generate image of rendered HTML
  const browser = await puppeteer.launch()
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
  const buffer = await elem.screenshot()
  await browser.close()

  // Insert JSON of the thing into the image
  const json = await dump(node, 'json')
  const image = (JSON.parse(json), buffer)

  return loadVFile(image)
}
