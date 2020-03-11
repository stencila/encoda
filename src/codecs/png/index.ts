/**
 * @module png
 */

import * as schema from '@stencila/schema'
import tempy from 'tempy'
import { dump } from '../../index'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

export type DecodeOptions = CommonDecodeOptions

export interface EncodeOptions extends CommonEncodeOptions {
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
      contentUrl: filePath
    })
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
    const { isStandalone, size } = { ...this.commonEncodeDefaults, ...options }

    // Generate HTML for the node.
    // Standalone: so that the theme option is respected.
    // Bundle: because Puppeteer will not load local (e.g. `/tmp`) files.
    // Other options e.g. themes are passed through
    const html = await dump(node, 'html', {
      ...options,
      isStandalone: true,
      isBundle: true
    })

    // Capture screenshot
    const page = await puppeteer.page()
    if (size !== undefined)
      await page.setViewport({
        width: size.width,
        height: size.height
      })

    await page.setContent(html, { waitUntil: 'networkidle0' })

    let buffer
    if (isStandalone) {
      buffer = await page.screenshot({
        encoding: 'binary',
        fullPage: size === undefined
      })
    } else {
      const [key, value] = Object.entries(schema.microdataRoot())[0]
      const elem = await page.$(`[${key}=${value}]`)
      if (elem === null)
        throw new Error('Woaaaah, this should never happen! Element not found!')
      const boundingBox = await elem.boundingBox()
      const viewPort = page.viewport()
      buffer = await elem.screenshot({
        encoding: 'binary',
        ...(size !== undefined && boundingBox !== null
          ? {
              clip: {
                x: boundingBox.x,
                y: boundingBox.y,
                width: Math.min(boundingBox.width, viewPort.width),
                height: Math.min(boundingBox.height, viewPort.height)
              }
            }
          : {})
      })
    }

    await page.close()

    return vfile.load(buffer)
  }
}
