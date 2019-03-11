// @ts-ignore
import parser from 'rehype-parse'
// @ts-ignore
import stringifier from 'rehype-stringify'
import unified from 'unified'
import { VFile } from 'vfile'

import { Node } from './sast'
import { hast2sast, sast2hast } from './sast-hast'

export const media = [
  'text/html'
]

export async function parse (file: VFile): Promise<Node> {
  const hast = unified()
    .use(parser)
    .parse(file)
  return hast2sast(hast)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  const hast = sast2hast(node)
  const html = unified()
    .use(stringifier)
    .stringify(hast)
  file.contents = html
}
