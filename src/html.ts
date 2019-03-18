
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import h from 'hyperscript'
import hyperscriptHelpers from 'hyperscript-helpers'
// @ts-ignore
import parser from 'rehype-parse'
import unified from 'unified'
import { VFile } from 'vfile'

import { Node } from './sast'
import { hast2sast, sast2hast } from './sast-hast'

let {
  html, head, body,
  div, p, blockquote, script,
  span, a, strong, em
} = hyperscriptHelpers(h)

export const media = [
  'text/html',

  'html'
]

export async function parse (file: VFile): Promise<Node> {
  const hast = unified()
    .use(parser)
    .parse(file)
  return hast2sast(hast)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  file.contents = beautifyHtml(unparse_(node).outerHTML)
}

function unparse_ (node: Node) {
  const type = node.type || typeof node
  const unparser = unparsers[type]
  if (!unparser) throw new Error(`No HTML unparser defined for node type "${node.type}"`)
  return unparser(node)
}

type Unparser = (node: Node) => Element

const unparsers: {[key: string]: Unparser} = {
  Document: (node: Node) => {
    let jsonld
    if (Object.keys(node).filter(key => !['type', 'body'].includes(key)).length) {
      jsonld = Object.assign({ '@context': 'http://stencila.github.io/schema/01-draft/context.jsonld' }, node)
      jsonld = JSON.stringify(jsonld, (key, value) => (key === 'body') ? undefined : value, '  ')
      jsonld = script({ type: 'application/ld+json' }, jsonld)
    }
    return html(
      head(jsonld),
      body(node.body.map(unparse_))
    )
  },

  Heading: (node: Node) => h(`h${node.depth}`, node.children.map(unparse_)),

  Paragraph: (node: Node) => p(node.children.map(unparse_)),
  Blockquote: (node: Node) => blockquote(node.children.map(unparse_)),

  Connect: (node: Node) => a('.connect', { href: node.resource }, node.content),
  Include: (node: Node) => div('.include', { href: node.resource }, node.content),

  Text: (node: Node) => node.value
}
