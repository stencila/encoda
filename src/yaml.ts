/**
 * Compiler for YAML
 */

import * as stencila from '@stencila/schema'
import yaml from 'js-yaml'
import { coerce } from './util'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/yaml']

export async function parse(file: VFile): Promise<stencila.Node> {
  return coerce(yaml.safeLoad(dump(file)))
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return load(yaml.safeDump(node))
}
