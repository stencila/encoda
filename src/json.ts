/**
 * Compiler for JSON
 */

import cloneDeep from 'lodash/cloneDeep'

import { Node } from './sast'
import { load, dump, VFile } from './vfile'

export const media = ['application/json', 'json']

export async function parse(file: VFile): Promise<Node> {
  return JSON.parse(dump(file))
}

export async function unparse(node: Node): Promise<VFile> {
  return load(JSON.stringify(node, null, '  '))
}

export function marshall(node: Node): Node {
  // Do not serialise properties starting with `$`
  const clone = cloneDeep(node)
  function walk(node: any) {
    if (node === null || typeof node !== 'object') return
    for (let [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) delete node[key]
      walk(child)
    }
  }
  walk(clone)
  return clone
}
