/**
 * @module pug
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import pug from 'pug'
import { load } from '../../index'
import * as vfile from '../../util/vfile'
import { Codec, GlobalEncodeOptions } from '../types'

const log = getLogger('encoda:pug')

export class PugCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['text/pug']

  // The above media type is not registered in the `mime` module
  // so we need to specify filename extensions
  public readonly extNames = ['pug']

  /**
   * Decode a `VFile` with Pug content to a Stencila `Node`.
   *
   * Although it's not the primary use of this codec,
   * a user may wish to use Pug as a convenient way to write
   * a structured document. This method simply converts Pug to HTML and
   * then decodes that into a `Node` tree.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const html = pug.render(content)
    const node = await load(html, 'html')
    return node
  }

  /**
   * Encode a Stencila `Node` to a `VFile` containing
   * a rendered Pug template.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (
    node: stencila.Node,
    options: GlobalEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    const { template, format } = options

    if (template === undefined) {
      log.error('The template option is required for this codec')
      return Promise.resolve(vfile.create())
    }
    if (format !== undefined && !['html', 'text/html'].includes(format)) {
      log.warn(`Unexpected output format specified for Pug template: ${format}`)
    }

    const locals = { node, ...(stencila.isEntity(node) ? node : {}) }
    const html = pug.renderFile(template, locals)
    return Promise.resolve(vfile.load(html))
  }
}
