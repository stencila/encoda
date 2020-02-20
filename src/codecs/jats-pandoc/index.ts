/**
 * @module jats
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as Pandoc from '../pandoc'
import { Codec, CommonEncodeOptions } from '../types'

const pandoc = new Pandoc.PandocCodec()

export class JatsPandocCodec extends Codec implements Codec {
  /**
   * See the note in the `JatsCodec` regarding this media type
   */
  public readonly mediaTypes = ['application/jats+xml']

  public readonly decode = (file: vfile.VFile): Promise<stencila.Node> => {
    return pandoc.decode(file, { from: Pandoc.InputFormat.jats })
  }

  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, {
      ...options,
      format: Pandoc.OutputFormat.jats,
      codecOptions: { flags: [`--template=jats-template.xml`] }
    })
  }
}
