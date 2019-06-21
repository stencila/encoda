/**
 * Codec for JSON
 */

import * as stencila from '@stencila/schema'
import { Encode } from '../..'
import * as vfile from '../../vfile'

export const mediaTypes = ['application/json']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return JSON.parse(await vfile.dump(file))
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return vfile.load(JSON.stringify(node, null, '  '))
}
