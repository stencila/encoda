/**
 * @module json
 */

import * as stencila from '@stencila/schema'
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
    return vfile.load(JSON.stringify(node, null, '  '))
  }
}
