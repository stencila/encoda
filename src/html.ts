import * as stencila from '@stencila/schema'
// @ts-ignore
import h from 'hyperscript'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import * as parse5 from 'parse5'
import { dump, load, VFile } from './vfile'

function stencilaType(node: stencila.Node): string {
  if (node && typeof node === 'object') {
    if (Array.isArray(node)) return 'array'
    else if (node.type) return node.type
    else return 'object'
  } else {
    return typeof node
  }
}

export const mediaTypes = ['text/html']

const cleanHtml = (html: string) =>
  beautifyHtml(html, {
    preserve_newlines: false
  })

export async function parse(file: VFile): Promise<stencila.Node> {
  const html = dump(file)
  const beautifulHtml = cleanHtml(html)
  const dom = parse5.parse(beautifulHtml) as parse5.DefaultTreeNode
  return parseNode(dom)
}

export async function unparse(thing: stencila.Node): Promise<VFile> {
  const dom = unparseNode((thing as unknown) as stencila.Node) as HTMLElement
  const html = dom.outerHTML
  const beautifulHtml = cleanHtml(html)
  return load(beautifulHtml)
}

function parseNode(node: parse5.DefaultTreeNode): stencila.Node {
  const nodeName = node.nodeName
  const parser = parsers[nodeName] || parsers['default']
  return parser(node)
}

type Parser = (node: parse5.DefaultTreeNode) => stencila.Node
// TODO: Tighten up type definition for parsers object
const parsers: { [key: string]: Parser } = {}

function parseNodes(
  nodes: Array<parse5.DefaultTreeNode>,
  block: boolean = false
) {
  return nodes
    .filter(node => (block ? node.nodeName !== '#text' : true))
    .map(parseNode)
}

function unparseNode(node: stencila.Node): string | HTMLElement {
  const type = stencilaType(node)

  switch (type) {
    case 'string':
      return node as string
    case '#text':
      // @ts-ignore
      return node.value
  }
  const unparser = unparsers[type] || unparsers['default']
  return unparser(node)
}
function unparseNodes(nodes?: Array<stencila.Node>) {
  return nodes ? nodes.map(unparseNode) : []
}
type Unparser = (node: stencila.Node) => HTMLElement
const unparsers: { [key: string]: Unparser } = {}

parsers['#document'] = node => {
  const doc = node as parse5.DefaultTreeDocument

  const html = (doc.childNodes.find(
    node => node.nodeName === 'html'
  ) as unknown) as parse5.DefaultTreeElement

  const body = (html.childNodes.find(
    node => node.nodeName === 'body'
  ) as unknown) as parse5.DefaultTreeElement
  if (!body) throw new Error('Document does not have a <body>')

  return {
    type: 'Article',
    articleBody: parseNodes(body.childNodes, true)
  }
}

unparsers['Article'] = node => {
  const article = node as stencila.Article
  return h('html', h('head'), h('body', unparseNodes(article.articleBody)))
}

// Heading

function parserHeading(depth: number) {
  return (node: parse5.DefaultTreeNode) => {
    const heading = node as parse5.DefaultTreeElement
    return {
      type: 'Heading',
      depth,
      content: parseNodes(heading.childNodes)
    }
  }
}
parsers['h1'] = parserHeading(1)
parsers['h2'] = parserHeading(2)
parsers['h3'] = parserHeading(3)
parsers['h4'] = parserHeading(4)
parsers['h5'] = parserHeading(5)
parsers['h6'] = parserHeading(6)

unparsers['Heading'] = node => {
  const heading = node as stencila.Heading
  return h(`h${heading.depth}`, unparseNodes(heading.content))
}

// Blockquote

parsers['blockquote'] = node => {
  const blockquote = node as parse5.DefaultTreeElement
  return {
    type: 'Blockquote',
    content: parseNodes(blockquote.childNodes, true)
  } as stencila.Blockquote
}

unparsers['Blockquote'] = node => {
  const blockquote = node as stencila.Blockquote
  return h('blockquote', unparseNodes(blockquote.content))
}

// Paragraph

parsers['p'] = node => {
  const paragraph = node as parse5.DefaultTreeElement
  return {
    type: 'Paragraph',
    content: parseNodes(paragraph.childNodes)
  } as stencila.Paragraph
}

unparsers['Paragraph'] = node => {
  const paragraph = node as stencila.Paragraph
  return h('p', unparseNodes(paragraph.content))
}

// Primitive nodes

parsers['#text'] = node => {
  const text = node as parse5.DefaultTreeTextNode
  return {
    type: '#text',
    value: text.value
  }
}

// Default parser and unparser

parsers['default'] = node => {
  return {
    type: node.nodeName
  }
}

unparsers['default'] = node => {
  return h('div', { 'data-type': stencilaType(node) })
}

/*
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
      jsonld = h('script', { type: 'application/ld+json' }, jsonld)
    }
    return h('html',
      h('head', jsonld),
      h('body', thing.body.map(unparse_))
    )
  },

  Heading: (thing: Thing) => h(`h${thing.depth}`, thing.children.map(unparse_)),

  Paragraph: (thing: Thing) => h('p', thing.children.map(unparse_)),
  Blockquote: (thing: Thing) => h('blockquote', thing.children.map(unparse_)),

  Table: (thing: Thing) => h('table', h('tbody', thing.children.map(unparse_))),
  TableRow: (thing: Thing) => h('tr', thing.children.map(unparse_)),
  TableCell: (thing: Thing) => h('td', thing.children.map(unparse_)),

  Connect: (thing: Thing) =>
    h('a.connect', { href: thing.resource }, thing.content),
  Include: (thing: Thing) =>
    h('div.include', { href: thing.resource }, thing.content),

  Link: (thing: Thing) =>
    h('a', { href: thing.url, title: thing.title }, thing.children.map(unparse_)),
  Image: (thing: Thing) =>
    h('img', { src: thing.url, title: thing.title, alt: thing.alt }),

  InlineCode: (thing: Thing) => h('code', thing.value),
  Emphasis: (thing: Thing) => h('em', thing.value),
  Strong: (thing: Thing) => h('strong', thing.value),
  Text: (thing: Thing) => thing.value,

  number: (thing: any) => h('span.number', thing.toString())
}
*/
