/**
 * @module json
 */

import * as stencila from '@stencila/schema'
import orderProperties from '../../util/orderProperties'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class JsonCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/json']

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    return JSON.parse(await vfile.dump(file))
  }

  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    const ordered = orderProperties(node)
    return vfile.load(JSON.stringify(ordered, null, '  '))
  }
}
