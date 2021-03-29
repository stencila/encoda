/**
 * [[include:src/codecs/png/README.md]]
 *
 * @module codecs/png
 */

import * as schema from '@stencila/schema'
import tempy from 'tempy'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'
import { HTMLCodec } from '../html'

const htmlCodec = new HTMLCodec()

export type DecodeOptions = CommonDecodeOptions

export interface EncodeOptions extends CommonEncodeOptions {
  /**
   * CSS selector for item/s to take an image of
   */
  selector?: string

  /**
   * The size of the image to create. Only applicable when
   * screen-shotting a node to create the image.
   */
  size?: {
    width: number
    height: number
  }
}

export class PngCodec extends Codec implements Codec {
  /**
   * @override {@link Codec.mediaTypes}
   */
  public readonly mediaTypes = ['image/png']

  /**
   * Decode a PNG image to a `ImageObject` node.
   *
   * If the `VFile` does not have a path, then it
   * is written to a temporary file, and that path used
   * for the image's `contentUrl`.
   *
   * @override {@link Codec.decode}
   */
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    let filePath = file.path
    if (filePath === undefined) {
      filePath = tempy.file({ extension: 'png' })
      await vfile.write(file, filePath)
    }
    return schema.imageObject({
      contentUrl: filePath,
    })
  }

  /**
   * @override Overrides {@link Codec.preWrite} so that media files
   * do NOT get written to a sibling folder (since they are effectively
   * included in the PNG file).
   */
  public preWrite(node: schema.Node): Promise<schema.Node> {
    return Promise.resolve(node)
  }

  /**
   * Encode a Stencila `Node` to a PNG.
   *
   * For `ImageObject` nodes, this simply saves the `contentUrl` as a
   * local, temporary file. For other node types, by dumping the node to HTML, and then
   * "screen-shotting" the HTML to a PNG.
   *
   * @override {@link Codec.encode}
   */
  public readonly encode = async (
    node: schema.Node,
    options: EncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const { isStandalone, selector, size } = {
      ...this.commonEncodeDefaults,
      ...options,
    }

    // If the node is not a creative work then wrap
    // it in one. This is done because themes usually assume that
    // nodes such as `Paragraph`, `CodeChunk` etc are not the root
    // node but are instead nested within another node that is the root.
    // See https://github.com/stencila/encoda/issues/545#issuecomment-630564742
    if (!schema.isCreativeWork(node)) {
      node = schema.creativeWork({ content: [node] })
    }

    // Generate HTML for the node.
    // Standalone: so that the theme option is respected.
    // Bundle: because Puppeteer will not load local (e.g. `/tmp`) files.
    // Other options e.g. themes are passed through
    const html = await htmlCodec.dump(node, {
      ...options,
      isStandalone: true,
      isBundle: true,
    })

    // Capture screenshot
    const page = await puppeteer.page()
    if (size !== undefined)
      await page.setViewport({
        width: size.width,
        height: size.height,
      })

    await page.setContent(html, { waitUntil: 'networkidle0' })

    let buffer
    if (isStandalone) {
      buffer = await page.screenshot({
        encoding: 'binary',
        fullPage: size === undefined,
      })
    } else {
      let cssSelector = selector
      if (cssSelector === undefined) {
        const [key, value] = Object.entries(schema.microdataRoot())[0]
        cssSelector = `[${key}=${value}]`
      }
      const elem = await page.$(cssSelector)
      if (elem === null)
        throw new Error(`No element found matching selector: ${cssSelector}`)
      const boundingBox = await elem.boundingBox()

      buffer = await elem.screenshot({
        encoding: 'binary',
        ...(size !== undefined && boundingBox !== null
          ? {
              clip: {
                x: boundingBox.x,
                y: boundingBox.y,
                width: Math.round(boundingBox.width),
                height: Math.round(boundingBox.height),
              },
            }
          : {}),
      })
    }

    await page.close()

    return vfile.load(buffer !== undefined ? buffer : '')
  }
}
