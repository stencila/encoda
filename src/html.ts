// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import h from 'hyperscript'
import hyperscriptHelpers from 'hyperscript-helpers'
// @ts-ignore
import parser from 'rehype-parse'
import unified from 'unified'
// @ts-ignore
import hast2mdast from 'hast-util-to-mdast'

import { Thing } from '@stencila/schema'
import { load, VFile } from './vfile'
import { mdast2sast } from './sast-mdast'

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

export const mediaTypes = ['text/html']

export async function parse(file: VFile): Promise<Thing> {
  const hast = unified()
    .use(parser, { emitParseErrors: true })
    .parse(file)
  const mdast = hast2mdast(hast)
  return mdast2sast(mdast)
}

export async function unparse(thing: Thing): Promise<VFile> {
  const html = beautifyHtml(unparse_(thing).outerHTML)
  return load(html)
}

function unparse_(thing: Thing) {
  const type = thing.type || typeof thing
  const unparser = unparsers[type]
  if (!unparser) {
    throw new Error(`No HTML unparser defined for thing type "${thing.type}"`)
  }
  return unparser(thing)
}

type Unparser = (thing: Thing) => Element

const unparsers: { [key: string]: Unparser } = {
  Document: (thing: Thing) => {
    let jsonld
    if (
      Object.keys(thing).filter(key => !['type', 'body'].includes(key)).length
    ) {
      jsonld = Object.assign(
        {
          '@context': 'http://stencila.github.io/schema/01-draft/context.jsonld'
        },
        thing
      )
      jsonld = JSON.stringify(
        jsonld,
        (key, value) => (key === 'body' ? undefined : value),
        '  '
      )
      jsonld = script({ type: 'application/ld+json' }, jsonld)
    }
    return html(head(jsonld), body(thing.body.map(unparse_)))
  },

  Heading: (thing: Thing) => h(`h${thing.depth}`, thing.children.map(unparse_)),

  Paragraph: (thing: Thing) => p(thing.children.map(unparse_)),
  Blockquote: (thing: Thing) => blockquote(thing.children.map(unparse_)),

  Table: (thing: Thing) => table(tbody(thing.children.map(unparse_))),
  TableRow: (thing: Thing) => tr(thing.children.map(unparse_)),
  TableCell: (thing: Thing) => td(thing.children.map(unparse_)),

  Connect: (thing: Thing) =>
    a('.connect', { href: thing.resource }, thing.content),
  Include: (thing: Thing) =>
    div('.include', { href: thing.resource }, thing.content),

  Link: (thing: Thing) =>
    a({ href: thing.url, title: thing.title }, thing.children.map(unparse_)),
  Image: (thing: Thing) =>
    img({ src: thing.url, title: thing.title, alt: thing.alt }),

  InlineCode: (thing: Thing) => code(thing.value),
  Emphasis: (thing: Thing) => em(thing.value),
  Strong: (thing: Thing) => strong(thing.value),
  Text: (thing: Thing) => thing.value,

  number: (thing: any) => span('.number', thing.toString())
}
