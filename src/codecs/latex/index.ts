/**
 * @module latex
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { Codec } from '../types'

const pandoc = new P.PandocCodec()

export class LatexCodec extends Codec implements Codec {
  public mediaTypes = ['application/x-latex']

  public extNames = ['latex', 'tex']

  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    return pandoc.decode(file, { from: P.InputFormat.latex })
  }

  public encode = async (
    node: stencila.Node,
    options = {}
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, {
      ...options,
      format: P.OutputFormat.latex
    })
  }
}
