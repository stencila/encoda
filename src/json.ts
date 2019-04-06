/**
 * Compiler for JSON
 */

import { Thing } from '@stencila/schema'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/json']

export async function parse(file: VFile): Promise<Thing> {
  return JSON.parse(dump(file))
}

export async function unparse(thing: Thing): Promise<VFile> {
  return load(JSON.stringify(thing, null, '  '))
}
