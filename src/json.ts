/**
 * Compiler for JSON
 */

import cloneDeep from 'lodash/cloneDeep'
import { VFile } from 'vfile'

import { Node } from './sast'

export const media = [
  'application/json'
]

export async function parse (file: VFile): Promise<Node> {
  if (file.contents) return JSON.parse(file.contents.toString())
  return {}
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  file.contents = JSON.stringify(marshall(node), null, '  ')
}

export function marshall (node: Node): Node {
  // Do not serialise properties starting with `$`
  const clone = cloneDeep(node)
  function walk (node: any) {
    if (node === null || typeof node !== 'object') return
    for (let [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) delete node[key]
      walk(child)
    }
  }
  walk(clone)
  return clone
}
