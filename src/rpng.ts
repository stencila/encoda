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

import puppeteer from 'puppeteer'

import { load, dump } from './index'
import * as SAST from './sast'
import { load as loadVFile, VFile } from './vfile'

export const media = ['rpng']

/**
 * Parse a rPNG to a Stencila node.
 *
 * This is done by extracting the JSON
 * from the `tEXt` chunk and parsing it.
 *
 * @param file The `VFile` to parse
 * @returns The Stencila node
 */
export async function parse(file: VFile): Promise<SAST.Node> {
  // TODO extract the JSON from the file.contents buffer
  const json =
    '{"type": "Text", "value": "The JSON extracted from the rPNG TEXt chunk"}'
  return load(json, 'json')
}

/**
 * Unparse a Stencila node to a rPNG.
 *
 * This is done by dumping the node to HTML,
 * "screenshotting" the HTML to a PNG and then inserting the
 * node's JSON into the image's `tEXt` chunk.
 *
 * @param node The Stencila node to unparse
 * @param file The `VFile` to unparse to
 */
export async function unparse(node: SAST.Node): Promise<VFile> {
  // Generate HTML of the `value` of the node
  if (!node.value) throw new Error('Node must have a value')
  let html = await dump(node.value, 'html')

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

  // Insert JSON of the node into the image
  const json = dump(node, 'json')
  // TODO insert json into tEXt chunk
  const image = buffer

  return loadVFile(image)
}
