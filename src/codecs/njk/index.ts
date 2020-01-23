/**
 * @module nunjucks
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import nunjucks from 'nunjucks'
import { dump } from '../../index'
import * as vfile from '../../util/vfile'
import { Codec, GlobalEncodeOptions } from '../types'
import { InternalError } from '@stencila/executa/dist/lib/base/errors'

const log = getLogger('encoda:nunjucks')

export class NunjucksCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['text/nunjucks']

  // The above media type is not registered in the `mime` module
  // so we need to specify filename extensions
  public readonly extNames = ['njk']

  /**
   * There is little (or no) reason to decode a Nunjucks file
   * so that is not supported.
   */
  public readonly decode = (): Promise<stencila.Node> => {
    log.error('Decoding of Nunjucks files is not supported')
    return Promise.resolve('')
  }

  /**
   * Encode a Stencila `Node` to a `VFile` containing
   * a rendered Nunjucks template using the node as the
   * rendering context.
   *
   * @param node The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (
    node: stencila.Node,
    options: GlobalEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    let { template, format } = options

    if (template === undefined) {
      log.error(`The template option is required for this codec`)
      return Promise.resolve(vfile.create())
    }

    if (format === undefined) {
      log.warn('No format specified, defaulting to HTML')
      format = 'html'
    }
    environ.addGlobal('format', format)

    const context = { node, ...(stencila.isEntity(node) ? node : {}) }
    return new Promise((resolve, reject) =>
      environ.render(template as string, context, (error, content) => {
        if (error !== null) return reject(error)
        if (content !== null) return resolve(vfile.load(content))
        return reject(
          new InternalError(
            'Unexpected conditions: both error and content are null'
          )
        )
      })
    )
  }
}

/**
 * The Nunjucks rendering environment.
 *
 * A module global to allow caching of templates
 * between calls to render.
 */
const environ = new nunjucks.Environment([new nunjucks.FileSystemLoader()], {
  autoescape: false
})

/**
 * The `dump` filter available in all Nunjucks templates.
 *
 * See the README for more details on how this is used.
 */
environ.addFilter(
  'dump',
  (...args) => {
    // See the (end of) this discussion on why args are handled this way
    // https://github.com/mozilla/nunjucks/issues/820
    const callback = args.pop()
    const node: stencila.Node = args[0]
    const format: string | undefined = args[1]

    const encodingFormat = format ?? environ.getGlobal('format')
    const encodeOptions: GlobalEncodeOptions = {
      // It makes no sense to dump a standalone document
      // into another, so force to false
      isStandalone: false,
      // Similarly, theme makes little sense in this content
      // but, currently, is required.
      theme: 'stencila'
    }

    dump(node, encodingFormat, encodeOptions)
      .then(content => callback(null, content))
      .catch(error => callback(error))
  },
  true
)
