/**
 * [[include:src/codecs/odt/README.md]]
 *
 * @module codecs/odt
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { InputFormat, OutputFormat, PandocCodec } from '../pandoc'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const pandoc = new PandocCodec()

export class ODTCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/vnd.oasis.opendocument.text']

  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<stencila.Node> => {
    return pandoc.decode(file, options, {
      pandocFormat: InputFormat.odt,
      pandocArgs: [`--extract-media=${file.path}.media`],
    })
  }

  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, options, {
      pandocFormat: OutputFormat.odt,
      ensureFile: true,
    })
  }
}
