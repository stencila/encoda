import {VFile} from './vfile'

export const media = [
  'text/markdown',
  'text/x-markdown',

  'ipynb'
]

export async function parse (file: VFile): Promise<Node> {
}

export async function unparse (node: Node, file: VFile): Promise<void> {
}
