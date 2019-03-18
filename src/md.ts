// @ts-ignore
import parser from 'remark-parse'
// @ts-ignore
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import compact from 'mdast-util-compact'
// @ts-ignore
import stringifier from 'remark-stringify'
import unified from 'unified'
import { VFile } from 'vfile'

import { Node } from './sast'
import { mdast2sast, sast2mdast } from './sast-mdast'

export const media = [
  'text/markdown',
  'text/x-markdown',

  'markdown',
  'md'
]

/**
 * Options for `remark-frontmatter` parser and stringifier
 *
 * @see https://github.com/remarkjs/remark-frontmatter#matter
 */
const FRONTMATTER_OPTIONS = [
  { type: 'yaml', marker: '-' }
]

export async function parse (file: VFile): Promise<Node> {
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .parse(file)
  compact(mdast, true)
  return mdast2sast(mdast)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  const mdast = sast2mdast(node)
  const md = unified()
    .use(stringifier)
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .stringify(mdast)
  file.contents = md
}
