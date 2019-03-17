/**
 * Compiler for YAML
 */

import { VFile } from 'vfile'
import yaml from 'js-yaml'

import { Node } from './sast'
import { marshall } from './json'

export const media = [
  'text/yaml',

  'yaml'
]

export async function parse (file: VFile): Promise<Node> {
  if (file.contents) return yaml.safeLoad(file.contents.toString())
  return {}
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  file.contents = yaml.safeDump(marshall(node))
}
