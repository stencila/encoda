/**
 * [[include:src/codecs/jats-pandoc/README.md]]
 *
 * @module codecs/jats-pandoc
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { InputFormat, OutputFormat, PandocCodec } from '../pandoc'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const pandoc = new PandocCodec()

export class JatsPandocCodec extends Codec implements Codec {
  /**
   * See the note in the `JatsCodec` regarding this media type
   */
  public readonly mediaTypes = ['application/jats+xml']

  public readonly decode = (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<stencila.Node> => {
    return pandoc.decode(file, options, {
      pandocFormat: InputFormat.jats,
    })
  }

  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, options, {
      pandocFormat: OutputFormat.jats,
      pandocArgs: [`--template=jats-template.xml`],
    })
  }
}
