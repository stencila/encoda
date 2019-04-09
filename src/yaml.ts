/**
 * Compiler for YAML
 */

import stencila from '@stencila/schema'
import yaml from 'js-yaml'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/yaml']

export async function parse(file: VFile): Promise<stencila.Node> {
  return yaml.safeLoad(dump(file))
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return load(yaml.safeDump(node))
}
