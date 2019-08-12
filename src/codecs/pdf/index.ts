/**
 * @module pdf
 */

import * as stencila from '@stencila/schema'
import { dump } from '../..'
import bundle from '../../util/bundle'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec, GlobalEncodeOptions } from '../types'

export class PDFCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public mediaTypes = ['application/pdf']

  // The above media type is registered in the `mime` module
  // so there is no need to specify `extNames`

  /**
   * This function is required (currently) but is (and probably never will be)
   * implemented.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    throw new Error(`Parsing of PDF files is not supported.`)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with PDF content.
   *
   * @param node The Stencila `Node` to encode
   * @param filePath The file system path to write the PDF to
   * @returns A promise that resolves to a `VFile`
   */
  public encode = async (
    node: stencila.Node,
    options: GlobalEncodeOptions = {}
  ): Promise<vfile.VFile> => {
    const bundled = await bundle(node)
    const html = await dump(bundled, 'html', options)

    const page = await puppeteer.page()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      path: options.filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2.54cm',
        bottom: '2.54cm',
        left: '2.54cm',
        right: '2.54cm'
      }
    })
    await page.close()

    return vfile.load(buffer)
  }
}
