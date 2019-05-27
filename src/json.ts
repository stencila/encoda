/**
 * Compiler for JSON
 */

import stencila from '@stencila/schema'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/json']

export async function parse(file: VFile): Promise<stencila.Node> {
  return JSON.parse(await dump(file))
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return load(JSON.stringify(node, null, '  '))
}
