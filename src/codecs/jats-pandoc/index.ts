/**
 * @module jats
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { Codec } from '../types'

const pandoc = new P.PandocCodec()

export class JatsPandocCodec extends Codec implements Codec {
  public readonly mediaTypes = []

  public readonly decode = (file: vfile.VFile): Promise<stencila.Node> => {
    return pandoc.decode(file, { from: P.InputFormat.jats })
  }

  public readonly encode = async (
    node: stencila.Node,
    options = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, {
      ...options,
      format: P.OutputFormat.jats,
      codecOptions: { flags: [`--template=jats-template.xml`] }
    })
  }
}
