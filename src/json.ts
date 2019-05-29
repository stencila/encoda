/**
 * Codec for JSON
 */

import * as stencila from '@stencila/schema'
import { coerce } from './util'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/json']

export async function decode(file: VFile): Promise<stencila.Node> {
  return coerce(JSON.parse(await dump(file)))
}

export async function encode(node: stencila.Node): Promise<VFile> {
  return load(JSON.stringify(node, null, '  '))
}
