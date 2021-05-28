/**
 * [[include:src/codecs/json/README.md]]
 *
 * @module codecs/json
 */

import { schema } from '@stencila/jesta'
import orderProperties from '../../util/orderProperties'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class JsonCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/json']

  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    return JSON.parse(await vfile.dump(file))
  }

  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    const ordered = orderProperties(node)
    return Promise.resolve(vfile.load(JSON.stringify(ordered, null, '  ')))
  }
}
