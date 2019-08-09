/**
 * @module jats
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { Codec } from '../types'

const pandoc = new P.Pandoc()

export class JatsPandoc extends Codec implements Codec {
  public mediaTypes = []

  public decode = (file: vfile.VFile): Promise<stencila.Node> => {
    return pandoc.decode(file, { from: P.InputFormat.jats })
  }

  public encode = async (
    node: stencila.Node,
    options = {}
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, {
      ...options,
      format: P.OutputFormat.jats,
      codecOptions: { flags: [`--template=jats-template.xml`] }
    })
  }
}
