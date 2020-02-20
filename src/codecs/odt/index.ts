/**
 * @module odt
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { Codec, CommonEncodeOptions } from '../types'

const pandoc = new P.PandocCodec()

export class ODTCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/vnd.oasis.opendocument.text']

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    return pandoc.decode(file, {
      from: P.InputFormat.odt,
      flags: [`--extract-media=${file.path}.media`]
    })
  }

  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, {
      ...options,
      format: P.OutputFormat.odt,
      codecOptions: {
        ensureFile: true
      }
    })
  }
}
