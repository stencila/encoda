/**
 * Compiler for YAML
 */

import yaml from 'js-yaml'

import { dump, load, VFile } from './vfile'
import { Node } from './sast'

export const media = ['text/yaml', 'yaml']

export async function parse(file: VFile): Promise<Node> {
  return yaml.safeLoad(dump(file))
}

export async function unparse(node: Node): Promise<VFile> {
  return load(yaml.safeDump(node))
}
