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
import puppeteer from 'puppeteer'
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

/**
 * Sniff a PNG file's contents to see if it is an rPNG
 *
 * @param filePath The file path to sniff
 */
export async function sniff(filePath: string): Promise<boolean> {
  // TODO if the extname is .png then sniff it's contents
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
  // TODO extract the JSON from the file.contents buffer
  const json =
    '{"type": "Text", "value": "The JSON extracted from the rPNG TEXt chunk"}'
  return load(json, 'json')
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
  const json = dump(node, 'json')
  // TODO insert json into tEXt chunk
  const image = buffer

  return loadVFile(image)
}
