/**
 * # HTML compiler
 *
 * This is a compiler for HyperText Markup Language (HTML).
 * It parses/unparses Stencila Document Tree (SDT) nodes from/to HTML.
 *
 * ## Philosophy
 *
 * ### Don't worry about lossy parsing from HTML
 *
 * The aim of this compiler is not to parse any old HTML file from off the interwebs.
 *
 * ### Aim for lossless unparsing to HTML
 *
 * The aim of this compiler is to be able to publish Stencila documents as
 * completely as possible. One way we achieve through JSON-LD metadata.
 *
 * ### Use custom elements where necessary
 *
 * For SDT nodes that do not have a natural HTML counterpart, we use
 * [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).
 *
 * ### Generate pretty HTML
 *
 * Because it's easier to debug.
 *
 * ## Dependencies
 *
 * Some of the main external dependencies:
 *
 * - `jsdom` for it's DOM API convenience with built in typing support .
 *   e.g. `doc.querySelector('p')` returns a `HTMLParagraphElement`.
 *
 * - `hyperscript` for it's beautifully minimal API with built in typing support.
 *   e.g. `h('p')` returns a `HTMLParagraphElement`
 *
 * - `collapse-whitespace` to avoid extraneous string elements in parsed content.
 *
 * - `js-beautify` for pretty generated HTML.
 *
 * @module html
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import * as stencila from '@stencila/schema'
import collapse from 'collapse-whitespace'
import h from 'hyperscript'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import jsdom from 'jsdom'
import { dump, load, VFile } from './vfile'

const document = new jsdom.JSDOM().window.document

export const mediaTypes = ['text/html']

/**
 * Parse a `VFile` with HTML contents to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  const html = dump(file)
  const dom = new jsdom.JSDOM(html)
  const document = dom.window.document
  collapse(document)
  return parseNode(document)
}

/**
 * Unparse a `stencila.Node` to a `VFile` with HTML contents.
 *
 * @param node The `stencila.Node` to unparse. Will be mutated to an `Node`.
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  const dom = unparseNode(node) as HTMLHtmlElement
  const beautifulHtml = beautifyHtml(dom.outerHTML, {
    indent_size: 2,
    indent_inner_html: true, // Indent <head> and <body> sections
    wrap_line_length: 100,
    preserve_newlines: false // Preserve existing line-breaks
  })
  return load(beautifulHtml)
}

function parseNode(node: Node): stencila.Node {
  const name = node.nodeName.toLowerCase()
  switch (name) {
    case '#document':
      return parseDocument(node as HTMLDocument)

    case 'p':
      return parseParagraph(node as HTMLParagraphElement)
    case 'blockquote':
      return parseBlockquote(node as HTMLQuoteElement)
    case 'pre':
      if (node.firstChild && node.firstChild.nodeName === 'CODE') {
        return parseCodeBlock(node as HTMLPreElement)
      }
      break
    case 'ul':
      return parseList(node as HTMLUListElement)
    case 'ol':
      return parseList(node as HTMLOListElement)
    case 'table':
      return parseTable(node as HTMLTableElement)
    case 'hr':
      return parseHR(node as HTMLHRElement)

    case 'em':
      return parseInlineElement(node as HTMLElement, 'Emphasis')
    case 'strong':
      return parseInlineElement(node as HTMLElement, 'Strong')
    case 'del':
      return parseInlineElement(node as HTMLElement, 'Delete')
    case 'a':
      return parseLink(node as HTMLAnchorElement)
    case 'q':
      return parseQuote(node as HTMLQuoteElement)
    case 'code':
      return parseCode(node as HTMLElement)
    case 'img':
      return parseImage(node as HTMLImageElement)

    case 's-null':
      return parseNull(node as HTMLElement)
    case 's-boolean':
      return parseBoolean(node as HTMLElement)
    case 's-number':
      return parseNumber(node as HTMLElement)
    case 's-array':
      return parseArray(node as HTMLElement)
    case 's-object':
      return parseObject(node as HTMLElement)

    case '#text':
      return parseText(node as Text)
  }

  const match = name.match(/^h(\d)$/)
  if (match) {
    return parseHeading(node as HTMLHeadingElement, parseInt(match[1], 10))
  }

  throw new Error(`No HTML parser for HTML element <${name}>`)
}

function unparseNode(node: stencila.Node): Node {
  const type = stencila.type(node)
  switch (type) {
    case 'Article':
      return unparseArticle(node as stencila.Article)

    case 'Heading':
      return unparseHeading(node as stencila.Heading)
    case 'Paragraph':
      return unparseParagraph(node as stencila.Paragraph)
    case 'QuoteBlock':
      return unparseQuoteBlock(node as stencila.QuoteBlock)
    case 'CodeBlock':
      return unparseCodeBlock(node as stencila.CodeBlock)
    case 'List':
      return unparseList(node as stencila.List)
    case 'Table':
      return unparseTable(node as stencila.Table)
    case 'ThematicBreak':
      return unparseThematicBreak(node as stencila.ThematicBreak)

    case 'Emphasis':
      return unparseInlineThing<'Emphasis'>(node, 'em')
    case 'Strong':
      return unparseInlineThing<'Strong'>(node, 'strong')
    case 'Delete':
      return unparseInlineThing<'Delete'>(node, 'del')
    case 'Link':
      return unparseLink(node as stencila.Link)
    case 'Quote':
      return unparseQuote(node as stencila.Quote)
    case 'Code':
      return unparseCode(node as stencila.Code)
    case 'ImageObject':
      return unparseImageObject(node as stencila.ImageObject)

    case 'null':
      return unparseNull(node as null)
    case 'boolean':
      return unparseBoolean(node as boolean)
    case 'number':
      return unparseNumber(node as number)
    case 'string':
      return unparseString(node as string)
    case 'array':
      return unparseArray(node as Array<any>)
    case 'object':
      return unparseObject(node as object)
  }
  throw new Error(`No HTML unparser for Stencila node type "${type}"`)
}

function parseBlockChildNodes(node: Node): stencila.BlockContent[] {
  return Array.from(node.childNodes).map(
    child => parseNode(child) as stencila.BlockContent
  )
}

function parseInlineChildNodes(node: Node): stencila.InlineContent[] {
  return Array.from(node.childNodes).map(
    child => parseNode(child) as stencila.InlineContent
  )
}

/**
 * Parse a `#document` node to a `stencila.CreativeWork`.
 */
function parseDocument(doc: HTMLDocument): stencila.CreativeWork {
  const head = doc.querySelector('head')
  if (!head) throw new Error('Document does not have a <head>!')

  const body = doc.querySelector('body')
  if (!body) throw new Error('Document does not have a <body>!')

  const jsonld = head.querySelector('script[type="application/ld+json"]')
  const metadata = jsonld ? JSON.parse(jsonld.innerHTML || '{}') : {}
  delete metadata['@context']

  // TODO: Allow for the different types of creative work based on type in
  // the jsonld
  return {
    type: 'Article',
    ...metadata,
    content: parseBlockChildNodes(body)
  }
}

/**
 * Generate a `<html>` element with supplied title, metadata and body content.
 */
function generateHtmlElement(
  title: string = 'Untitled',
  metadata: { [key: string]: any } = {},
  body: Array<Node> = []
): HTMLHtmlElement {
  // prettier-ignore
  return h('html',
    h('head',
      h('title', title),
      h('script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'http://stencila.github.io/schema/stencila.jsonld',
          ...metadata
        })
      )
    ),
    h('body', body)
  )
}

/**
 * Unparse a `stencila.Article` to a `#document` node.
 */
function unparseArticle(article: stencila.Article): HTMLHtmlElement {
  const { type, title, content, ...rest } = article
  const metadata = { type, title, ...rest }
  const body = content ? content.map(unparseNode) : []
  return generateHtmlElement(title, metadata, body)
}

/**
 * Parse a `<h1>` etc element to a `stencila.Heading`.
 */
function parseHeading(
  heading: HTMLHeadingElement,
  depth: number
): stencila.Heading {
  return { type: 'Heading', depth, content: parseInlineChildNodes(heading) }
}

/**
 * Unparse a `stencila.Heading` to a `<h1>` etc element.
 */
function unparseHeading(heading: stencila.Heading): HTMLHeadingElement {
  return h(`h${heading.depth}`, heading.content.map(unparseNode))
}

/**
 * Parse a `<p>` element to a `stencila.Paragraph`.
 */
function parseParagraph(para: HTMLParagraphElement): stencila.Paragraph {
  return { type: 'Paragraph', content: parseInlineChildNodes(para) }
}

/**
 * Unparse a `stencila.Paragraph` to a `<p>` element.
 */
function unparseParagraph(para: stencila.Paragraph): HTMLParagraphElement {
  return h('p', para.content.map(unparseNode))
}

/**
 * Parse a `<blockquote>` element to a `stencila.QuoteBlock`.
 */
function parseBlockquote(elem: HTMLQuoteElement): stencila.QuoteBlock {
  const quoteBlock: stencila.QuoteBlock = {
    type: 'QuoteBlock',
    content: parseBlockChildNodes(elem)
  }
  const cite = elem.getAttribute('cite')
  if (cite) quoteBlock.citation = cite
  return quoteBlock
}

/**
 * Unparse a `stencila.QuoteBlock` to a `<blockquote>` element.
 */
function unparseQuoteBlock(block: stencila.QuoteBlock): HTMLQuoteElement {
  return h(
    'blockquote',
    { cite: block.citation },
    block.content.map(unparseNode)
  )
}

/**
 * Parse a `<pre><code class="language-xxx">` element to a `stencila.CodeBlock`.
 */
function parseCodeBlock(elem: HTMLPreElement): stencila.CodeBlock {
  const code = elem.querySelector('code')
  if (!code) throw new Error('Woaah, this should never happen!')
  const { language, value } = parseCode(code)
  return {
    type: 'CodeBlock',
    language,
    value
  }
}

/**
 * Unparse a `stencila.CodeBlock` to a `<pre><code class="language-xxx">` element.
 */
function unparseCodeBlock(block: stencila.CodeBlock): HTMLPreElement {
  const code = unparseCode(block)
  return h('pre', code)
}

/**
 * Parse a `<ul>` or `<ol>` element to a `stencila.List`.
 */
function parseList(list: HTMLUListElement | HTMLOListElement): stencila.List {
  const order = list.tagName === 'UL' ? 'unordered' : 'ascending'
  return {
    type: 'List',
    order,
    items: Array.from(list.childNodes).map(
      // TODO: Currently assumes only one element per <li>
      (li: Node): stencila.Node =>
        li.firstChild ? parseNode(li.firstChild) : null
    )
  }
}

/**
 * Unparse a `stencila.List` to a `<ul>` or `<ol>` element.
 */
function unparseList(list: stencila.List): HTMLUListElement {
  return h(
    list.order === 'unordered' ? 'ul' : 'ol',
    list.items.map(
      (item: stencila.Node): HTMLLIElement => h('li', unparseNode(item))
    )
  )
}

/**
 * Parse a `<table>` element to a `stencila.Table`.
 */
function parseTable(table: HTMLTableElement): stencila.Table {
  return {
    type: 'Table',
    rows: Array.from(table.querySelectorAll('tr')).map(
      (row: HTMLTableRowElement): stencila.TableRow => {
        return {
          type: 'TableRow',
          cells: Array.from(row.querySelectorAll('td')).map(
            (cell: HTMLTableDataCellElement): stencila.TableCell => {
              return {
                type: 'TableCell',
                content: parseInlineChildNodes(cell)
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Unparse a `stencila.Table` to a `<table>` element.
 */
function unparseTable(table: stencila.Table): HTMLTableElement {
  // prettier-ignore
  return h('table', h('tbody', table.rows.map(
      (row: stencila.TableRow): HTMLTableRowElement => {
        return h('tr', row.cells.map(
          (cell: stencila.TableCell): HTMLTableDataCellElement => {
            return h('td', cell.content.map(unparseNode))
          }
        ))
      }
    )
  ))
}

/**
 * Parse a `<hr>` element to a `stencila.ThematicBreak`.
 */
function parseHR(hr: HTMLHRElement): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Unparse a `stencila.ThematicBreak` to a `<hr>` element.
 */
function unparseThematicBreak(tb: stencila.ThematicBreak): HTMLHRElement {
  return h('hr')
}

/**
 * Parse an inline element e.g `<em>` to a inline `Thing` e.g. `Emphasis`.
 */
function parseInlineElement<Type extends keyof stencila.Types>(
  elem: HTMLElement,
  type: Type
): stencila.Types[Type] {
  return { type, content: parseInlineChildNodes(elem) }
}

/**
 * Unparse an inline `Thing` to an inline element e.g. `<em>`.
 */
function unparseInlineThing<Type extends keyof stencila.Types>(
  node: stencila.Node,
  tag: string
): HTMLElement {
  node = node as stencila.Types[Type]
  // @ts-ignore
  return h(tag, node.content.map(unparseNode))
}

/**
 * Parse a `<a>` element to a `stencila.Link`.
 */
function parseLink(elem: HTMLAnchorElement): stencila.Link {
  const href = elem.getAttribute('href') || '#'
  return { type: 'Link', target: href, content: parseInlineChildNodes(elem) }
}

/**
 * Unparse a `stencila.Link` to a `<a>` element.
 */
function unparseLink(link: stencila.Link): HTMLAnchorElement {
  return h('a', { href: link.target }, link.content.map(unparseNode))
}

/**
 * Parse a `<q>` element to a `stencila.Quote`.
 */
function parseQuote(elem: HTMLQuoteElement): stencila.Quote {
  const quote: stencila.Quote = { type: 'Quote', content: [elem.innerHTML] }
  const cite = elem.getAttribute('cite')
  if (cite) quote.citation = cite
  return quote
}

/**
 * Unparse a `stencila.Quote` to a `<q>` element.
 */
function unparseQuote(quote: stencila.Quote): HTMLQuoteElement {
  return h('q', { cite: quote.citation }, quote.content)
}

/**
 * Parse a `<code>` element to a `stencila.Code`.
 */
function parseCode(elem: HTMLElement): stencila.Code {
  const code: stencila.Code = { type: 'Code', value: elem.innerHTML }
  const clas = elem.getAttribute('class')
  if (clas) {
    const match = clas.match(/^language-(\w+)$/)
    if (match) {
      code.language = match[1]
    }
  }
  return code
}

/**
 * Unparse a `stencila.Code` to a `<code>` element.
 */
function unparseCode(code: stencila.Code): HTMLElement {
  const clas = code.language ? `language-${code.language}` : undefined
  return h('code', { class: clas }, code.value)
}

/**
 * Parse a `<img>` element to a `stencila.ImageObject`.
 */
function parseImage(elem: HTMLImageElement): stencila.ImageObject {
  const image: stencila.ImageObject = {
    type: 'ImageObject',
    contentUrl: elem.src
  }
  if (elem.alt) image.caption = elem.alt
  return image
}

/**
 * Unparse a `stencila.ImageObject` to a `<img>` element.
 */
function unparseImageObject(image: stencila.ImageObject): HTMLImageElement {
  return h('img', {
    alt: image.caption,
    src: image.contentUrl
  })
}

/**
 * Parse a `<s-null>` element to a `null`.
 */
function parseNull(elem: HTMLElement): null {
  return null
}

/**
 * Unparse a `null` to a `<s-null>` element.
 */
function unparseNull(value: null): HTMLElement {
  return h('s-null', 'null')
}

/**
 * Parse a `<s-boolean>` element to a `boolean`.
 */
function parseBoolean(elem: HTMLElement): boolean {
  return elem.innerHTML === 'true' ? true : false
}

/**
 * Unparse a `boolean` to a `<s-boolean>` element.
 */
function unparseBoolean(value: boolean): HTMLElement {
  return h('s-boolean', value === true ? 'true' : 'false')
}

/**
 * Parse a `<s-number>` element to a `number`.
 */
function parseNumber(elem: HTMLElement): number {
  return parseFloat(elem.innerHTML || '0')
}

/**
 * Unparse a `number` to a `<s-number>` element.
 */
function unparseNumber(value: number): HTMLElement {
  return h('s-number', value.toString())
}

/**
 * Parse a `<s-array>` element to a `array`.
 */
function parseArray(elem: HTMLElement): Array<any> {
  return JSON.parse(elem.innerHTML || '[]')
}

/**
 * Unparse a `array` to a `<s-array>` element.
 */
function unparseArray(value: Array<any>): HTMLElement {
  return h('s-array', JSON.stringify(value))
}

/**
 * Parse a `<s-object>` element to a `object`.
 */
function parseObject(elem: HTMLElement): object {
  return JSON.parse(elem.innerHTML || '{}')
}

/**
 * Unparse a `object` to a `<s-object>` element.
 */
function unparseObject(value: object): HTMLElement {
  return h('s-object', JSON.stringify(value))
}

/**
 * Parse a `#text` node to a `string`.
 */
function parseText(text: Text): string {
  return text.data
}

/**
 * Unparse a `string` to a `#text` node.
 */
function unparseString(value: string): Text {
  return document.createTextNode(value)
}
