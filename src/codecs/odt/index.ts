/**
 * @module odt
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { Codec } from '../types'

const pandoc = new P.Pandoc()

export class ODT extends Codec implements Codec {
  public mediaTypes = ['application/vnd.oasis.opendocument.text']

  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    return pandoc.decode(file, {
      from: P.InputFormat.odt,
      flags: [`--extract-media=${file.path}.media`]
    })
  }

  public encode = async (
    node: stencila.Node,
    options = {}
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
