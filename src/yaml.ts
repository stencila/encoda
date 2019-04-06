/**
 * Compiler for YAML
 */

import { Thing } from '@stencila/schema'
import yaml from 'js-yaml'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/yaml']

export async function parse(file: VFile): Promise<Thing> {
  return yaml.safeLoad(dump(file))
}

export async function unparse(thing: Thing): Promise<VFile> {
  return load(yaml.safeDump(thing))
}
