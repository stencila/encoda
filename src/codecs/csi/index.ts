/**
 * [[include:src/codecs/csi/README.md]]
 *
 * @module codecs/csi
 */

import schema from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

/**
 * Codec for comma separated items
 */
export class CsiCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/plain']

  public readonly extNames = ['csi']

  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const csi = await vfile.dump(file)
    return csi.split(/\s*,\s*/)
  }

  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    const items = Array.isArray(node) ? node : [node]
    const csi = items
      .map((item) =>
        typeof item === 'object' ? JSON.stringify(item) : `${item}`
      )
      .join(', ')
    return Promise.resolve(vfile.load(csi))
  }
}
