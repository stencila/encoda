// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import h from 'hyperscript'
import hyperscriptHelpers from 'hyperscript-helpers'
// @ts-ignore
import parser from 'rehype-parse'
import unified from 'unified'

import { Node } from './sast'
import { hast2sast, sast2hast } from './sast-hast'
import { load, VFile } from './vfile'

let {
  html,
  head,
  body,
  div,
  p,
  blockquote,
  script,
  table,
  tbody,
  tr,
  td,
  span,
  a,
  strong,
  em,
  img,
  code
} = hyperscriptHelpers(h)

export const media = ['text/html', 'html']

export async function parse(file: VFile): Promise<Node> {
  const hast = unified()
    .use(parser, { emitParseErrors: true })
    .parse(file)
  return hast2sast(hast)
}

export async function unparse(node: Node): Promise<VFile> {
  const html = beautifyHtml(unparse_(node).outerHTML)
  return load(html)
}

function unparse_(node: Node) {
  const type = node.type || typeof node
  const unparser = unparsers[type]
  if (!unparser) {
    throw new Error(`No HTML unparser defined for node type "${node.type}"`)
  }
  return unparser(node)
}

type Unparser = (node: Node) => Element

const unparsers: { [key: string]: Unparser } = {
  Document: (node: Node) => {
    let jsonld
    if (
      Object.keys(node).filter(key => !['type', 'body'].includes(key)).length
    ) {
      jsonld = Object.assign(
        {
          '@context': 'http://stencila.github.io/schema/01-draft/context.jsonld'
        },
        node
      )
      jsonld = JSON.stringify(
        jsonld,
        (key, value) => (key === 'body' ? undefined : value),
        '  '
      )
      jsonld = script({ type: 'application/ld+json' }, jsonld)
    }
    return html(head(jsonld), body(node.body.map(unparse_)))
  },

  Heading: (node: Node) => h(`h${node.depth}`, node.children.map(unparse_)),

  Paragraph: (node: Node) => p(node.children.map(unparse_)),
  Blockquote: (node: Node) => blockquote(node.children.map(unparse_)),

  Table: (node: Node) => table(tbody(node.children.map(unparse_))),
  TableRow: (node: Node) => tr(node.children.map(unparse_)),
  TableCell: (node: Node) => td(node.children.map(unparse_)),

  Connect: (node: Node) => a('.connect', { href: node.resource }, node.content),
  Include: (node: Node) =>
    div('.include', { href: node.resource }, node.content),

  Link: (node: Node) =>
    a({ href: node.url, title: node.title }, node.children.map(unparse_)),
  Image: (node: Node) =>
    img({ src: node.url, title: node.title, alt: node.alt }),

  InlineCode: (node: Node) => code(node.value),
  Emphasis: (node: Node) => em(node.value),
  Strong: (node: Node) => strong(node.value),
  Text: (node: Node) => node.value,

  number: (node: any) => span('.number', node.toString())
}
