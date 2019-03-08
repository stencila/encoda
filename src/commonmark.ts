// @ts-ignore
import parser from 'remark-parse'
// @ts-ignore
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import stringifier from 'remark-stringify'
import unified from 'unified'
import vfile, { VFile } from 'vfile'

import { Node } from './sast'
import { from, to } from './sast-mdast'

export const media = [
  'text/markdown',
  'text/x-markdown'
]

export async function parse (file: VFile): Promise<Node> {
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, [
      { type: 'yaml', marker: '-', anywhere: true }
    ])
    .parse(file)
  return from(mdast)
}

export async function unparse (node: Node): Promise<VFile> {
  const mdast = to(node)
  const md = unified()
    .use(stringifier)
    .stringify(mdast)
  return vfile(md)
}
