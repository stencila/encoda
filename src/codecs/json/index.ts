/**
 * Codec for JSON
 */

import * as stencila from '@stencila/schema'
import { Encode } from '.'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/json']

export async function decode(file: VFile): Promise<stencila.Node> {
  return JSON.parse(await dump(file))
}

export const encode: Encode = async (node: stencila.Node): Promise<VFile> => {
  return load(JSON.stringify(node, null, '  '))
}
