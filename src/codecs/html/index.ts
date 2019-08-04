/**
 * @module html
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import {
  isArticle,
  isBlockContent,
  isInlineContent,
  markTypes,
  nodeType
} from '@stencila/schema/dist/util'
import collapse from 'collapse-whitespace'
import escape from 'escape-html'
import fs from 'fs'
// @ts-ignore
import GithubSlugger from 'github-slugger'
import h from 'hyperscript'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import jsdom from 'jsdom'
import JSON5 from 'json5'
import path from 'path'
import { EncodeOptions } from '../..'
import { columnIndexToName } from '../../codecs/xlsx'
import bundle from '../../util/bundle'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const doc = new jsdom.JSDOM().window.document

const log = getLogger('encoda:html')

// Ensures unique `id` attributes (e.g. for headings)
const slugger = new GithubSlugger()

export const mediaTypes = ['text/html']

export const beautify = (html: string): string =>
  /* eslint-disable @typescript-eslint/camelcase */
  beautifyHtml(html, {
    indent_size: 2,
    indent_inner_html: true, // Indent <head> and <body> sections
    wrap_line_length: 100,
    preserve_newlines: false // Preserve existing line-breaks
  })
/* eslint-enable @typescript-eslint/camelcase */

const getArticleMetaData = (
  node: stencila.Node
): Exclude<stencila.Article, 'content'> => {
  if (isArticle(node)) {
    const { content, ...metadata } = node
    return metadata
  }

  return {
    authors: [],
    title: 'Untitled',
    type: 'Article'
  }
}

export class HtmlCodec implements Codec {
  public encode = async (
    node: stencila.Node,
    options: EncodeOptions = {}
  ): Promise<vfile.VFile> => {
    const {
      isStandalone = true,
      isBundle = false,
      theme = 'stencila'
    } = options

    // Reset the slugger to avoid unnecessarily adding numbers to ids
    // in order to make them unique
    slugger.reset()

    const nodeToEncode = isBundle ? await bundle(node) : node
    let dom: HTMLHtmlElement = HtmlCodec.encodeNode(nodeToEncode, {
      isStandalone,
      theme
    }) as HTMLHtmlElement

    if (isStandalone) {
      const { title, ...metadata } = getArticleMetaData(node)
      dom = HtmlCodec.generateHtmlElement(title, metadata, [dom], options)
    }

    const beautifulHtml = beautify(dom.outerHTML)
    return vfile.load(beautifulHtml)
  }

  /**
   * Decode a `VFile` with HTML contents to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    const html = await vfile.dump(file)
    const dom = new jsdom.JSDOM(html)
    const document = dom.window.document
    collapse(document)
    const node = HtmlCodec.decodeNode(document)
    if (!node) throw new Error(`Unable to decode HTML`)
    return node
  }

  private static decodeNode = (node: Node): stencila.Node | undefined => {
    const name = node.nodeName.toLowerCase()
    switch (name) {
      case '#document':
        return HtmlCodec.decodeDocument(node as HTMLDocument)

      case 'article':
        return HtmlCodec.decodeArticle(node as HTMLElement)

      case 'div':
        return HtmlCodec.decodeDiv(node as HTMLDivElement)

      case 'p':
        return HtmlCodec.decodeParagraph(node as HTMLParagraphElement)
      case 'blockquote':
        return HtmlCodec.decodeBlockquote(node as HTMLQuoteElement)
      case 'pre':
        if (node.firstChild && node.firstChild.nodeName === 'CODE') {
          return HtmlCodec.decodeCodeBlock(node as HTMLPreElement)
        }
        break
      case 'ul':
        return HtmlCodec.decodeList(node as HTMLUListElement)
      case 'ol':
        return HtmlCodec.decodeList(node as HTMLOListElement)
      case 'li':
        return HtmlCodec.decodeListItem(node as HTMLLIElement)
      case 'table':
        return HtmlCodec.decodeTable(node as HTMLTableElement)
      case 'stencila-datatable':
        return HtmlCodec.decodeDatatable(node as HTMLDivElement)
      case 'hr':
        return HtmlCodec.decodeHR(node as HTMLHRElement)

      case 'em':
        return HtmlCodec.decodeMark(node as HTMLElement, 'Emphasis')
      case 'strong':
        return HtmlCodec.decodeMark(node as HTMLElement, 'Strong')
      case 'del':
        return HtmlCodec.decodeMark(node as HTMLElement, 'Delete')
      case 'sup':
        return HtmlCodec.decodeMark(node as HTMLElement, 'Superscript')
      case 'sub':
        return HtmlCodec.decodeMark(node as HTMLElement, 'Subscript')
      case 'a':
        return HtmlCodec.decodeLink(node as HTMLAnchorElement)
      case 'q':
        return HtmlCodec.decodeQuote(node as HTMLQuoteElement)
      case 'code':
        return HtmlCodec.decodeCode(node as HTMLElement)
      case 'img':
        return HtmlCodec.decodeImage(node as HTMLImageElement)

      case 'stencila-null':
        return HtmlCodec.decodeNull(node as HTMLElement)
      case 'stencila-boolean':
        return HtmlCodec.decodeBoolean(node as HTMLElement)
      case 'stencila-number':
        return HtmlCodec.decodeNumber(node as HTMLElement)
      case 'stencila-array':
        return HtmlCodec.decodeArray(node as HTMLElement)
      case 'stencila-object':
        return HtmlCodec.decodeObject(node as HTMLElement)
      case 'stencila-thing':
        return HtmlCodec.decodeThing(node as HTMLElement)

      case 'script':
        return undefined

      case '#text':
        return HtmlCodec.decodeText(node as Text)
    }

    const match = name.match(/^h(\d)$/)
    if (match) {
      return HtmlCodec.decodeHeading(
        node as HTMLHeadingElement,
        parseInt(match[1], 10)
      )
    }

    log.warn(`No handler for HTML element <${name}>`)
    return undefined
  }

  private static encodeNode = (node: stencila.Node, options: {} = {}): Node => {
    switch (nodeType(node)) {
      case 'Article':
        return HtmlCodec.encodeArticle(node as stencila.Article)

      case 'Include':
        return HtmlCodec.encodeInclude(node as stencila.Include)

      case 'Heading':
        return HtmlCodec.encodeHeading(node as stencila.Heading)
      case 'Paragraph':
        return HtmlCodec.encodeParagraph(node as stencila.Paragraph)
      case 'QuoteBlock':
        return HtmlCodec.encodeQuoteBlock(node as stencila.QuoteBlock)
      case 'CodeBlock':
        return HtmlCodec.encodeCodeBlock(node as stencila.CodeBlock)
      case 'CodeChunk':
        return HtmlCodec.encodeCodeChunk(node as stencila.CodeChunk)
      case 'List':
        return HtmlCodec.encodeList(node as stencila.List)
      case 'ListItem':
        return HtmlCodec.encodeListItem(node as stencila.ListItem)
      case 'Table':
        return HtmlCodec.encodeTable(node as stencila.Table)
      case 'Datatable':
        return HtmlCodec.encodeDatatable(node as stencila.Datatable)
      case 'ThematicBreak':
        return HtmlCodec.encodeThematicBreak(node as stencila.ThematicBreak)

      case 'Emphasis':
        return HtmlCodec.encodeMark(node as stencila.Emphasis, 'em')
      case 'Strong':
        return HtmlCodec.encodeMark(node as stencila.Strong, 'strong')
      case 'Delete':
        return HtmlCodec.encodeMark(node as stencila.Strong, 'del')
      case 'Superscript':
        return HtmlCodec.encodeMark(node as stencila.Superscript, 'sup')
      case 'Subscript':
        return HtmlCodec.encodeMark(node as stencila.Subscript, 'sub')
      case 'Link':
        return HtmlCodec.encodeLink(node as stencila.Link)
      case 'Quote':
        return HtmlCodec.encodeQuote(node as stencila.Quote)
      case 'Code':
        return HtmlCodec.encodeCode(node as stencila.Code)
      case 'ImageObject':
        return HtmlCodec.encodeImageObject(node as stencila.ImageObject)
      case 'Math':
        return HtmlCodec.encodeMath(node as object)

      case 'null':
        return HtmlCodec.encodeNull(node as null)
      case 'boolean':
        return HtmlCodec.encodeBoolean(node as boolean)
      case 'number':
        return HtmlCodec.encodeNumber(node as number)
      case 'string':
        return HtmlCodec.encodeString(node as string)
      case 'array':
        return HtmlCodec.encodeArray(node as any[])
      case 'object':
        return HtmlCodec.encodeObject(node as object)
      default:
        return HtmlCodec.encodeThing(node as stencila.Thing)
    }
  }

  private static decodeBlockChildNodes = (
    node: Node
  ): stencila.BlockContent[] => {
    return Array.from(node.childNodes)
      .map(child => HtmlCodec.decodeNode(child))
      .filter(isBlockContent)
  }

  private static decodeInlineChildNodes = (
    node: Node
  ): stencila.InlineContent[] => {
    return Array.from(node.childNodes)
      .map(child => HtmlCodec.decodeNode(child))
      .filter(isInlineContent)
  }

  /**
   * Decode a `#document` node to a `stencila.Node`.
   */
  private static decodeDocument = (
    docToDecode: HTMLDocument
  ): stencila.Node => {
    const head = docToDecode.querySelector('head')
    if (!head) throw new Error('Document does not have a <head>!')

    const body = docToDecode.querySelector('body')
    if (!body) throw new Error('Document does not have a <body>!')

    const jsonld = head.querySelector('script[type="application/ld+json"]')
    const metadata = jsonld ? JSON.parse(jsonld.innerHTML || '{}') : {}
    delete metadata['@context']

    if (!jsonld && body.childElementCount === 1) {
      const node = HtmlCodec.decodeNode(body.children[0])
      if (!node) throw new Error(`Top level node is not defined`)
      return node
    }

    // TODO: Allow for the different types of creative work based on type in
    // the jsonld
    return {
      type: 'Article',
      ...metadata,
      content: HtmlCodec.decodeBlockChildNodes(body)
    }
  }

  /**
   * Decode a `<div>` node to a Stencila `Node`.
   *
   * A `<div>` is treated as having no semantic meaning
   * and so this function decodes it's children.
   */
  private static decodeDiv = (
    div: HTMLDivElement
  ): stencila.Node | undefined => {
    return [...div.childNodes].map(HtmlCodec.decodeNode)
  }

  /**
   * Generate a `<html>` element with supplied title, metadata, body content, and
   * optionally custom CSS to style the document with.
   */
  private static generateHtmlElement = (
    title: string = 'Untitled',
    metadata: { [key: string]: any } = {},
    body: Node[] = [],
    options: EncodeOptions = {}
  ): HTMLHtmlElement => {
    const { isBundle = false, theme = 'stencila' } = options

    log.debug(`Generating <html> elem with options ${JSON.stringify(options)}`)

    let themeCss
    let themeJs
    if (isBundle) {
      // Bundle the theme into the document
      const themePath = path.resolve(
        require.resolve('@stencila/thema'),
        '..',
        'themes',
        theme
      )
      themeCss = h('style', {
        innerHTML: fs
          .readFileSync(path.join(themePath, 'styles.css'))
          .toString()
      })
      themeJs = h('script', {
        innerHTML: fs.readFileSync(path.join(themePath, 'index.js')).toString()
      })
    } else {
      // Add links to the theme to the document
      const themaVersion = require(path.join(
        require.resolve('@stencila/thema'),
        '..',
        '..',
        'package.json'
      )).version

      const themeBaseUrl = `https://unpkg.com/@stencila/thema@${themaVersion}/dist/themes/${theme}`
      themeCss = h('link', {
        href: `${themeBaseUrl}/styles.css`,
        rel: 'stylesheet'
      })
      themeJs = h('script', {
        src: `${themeBaseUrl}/index.js`,
        type: 'text/javascript'
      })
    }

    const jsonld = h(
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'http://stencila.github.io/schema/stencila.jsonld',
        ...metadata
      })
    )

    return h(
      'html',
      h(
        'head',
        h('title', title),
        h('meta', { charset: 'utf-8' }),
        h('meta', {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0'
        }),
        h('meta', { 'http-equiv': 'X-UA-Compatible', content: 'ie=edge' }),
        jsonld,
        themeCss,
        themeJs
      ),
      h('body', body)
    )
  }

  /**
   * Decode an `<article>` element to a `Article` node.
   */
  private static decodeArticle = (element: HTMLElement): stencila.Article => {
    const titleEl = element.querySelector('h1[role=title]')
    const title = titleEl ? titleEl.innerHTML : 'Untitled'
    if (titleEl) titleEl.remove()

    return {
      type: 'Article',
      title,
      authors: [],
      content: [...element.childNodes].reduce(
        (nodes: stencila.Node[], node) => {
          const decodedNode = HtmlCodec.decodeNode(node)
          return decodedNode ? [...nodes, decodedNode] : nodes
        },
        []
      )
    }
  }

  /**
   * Encode an `Article` node to a `<article>` element.
   */
  private static encodeArticle = (article: stencila.Article): HTMLElement => {
    const { type, title, content, references } = article
    const titleEl = h('h1', title)
    titleEl.setAttribute('role', 'title')
    const elements = content ? content.map(HtmlCodec.encodeNode) : []
    const refs = references ? HtmlCodec.encodeReferences(references) : []
    return h('article', titleEl, ...elements, refs)
  }

  private static encodeReferences = (
    references: (string | stencila.CreativeWork)[]
  ): HTMLElement => {
    return h(
      'section',
      h('h1', 'References'),
      ...references.map(HtmlCodec.encodeReference)
    )
  }

  private static encodeReference = (
    reference: string | stencila.CreativeWork
  ): HTMLElement => {
    return typeof reference === 'string'
      ? h('div', reference)
      : HtmlCodec.encodeCreativeWork(reference)
  }

  private static encodeCreativeWork = (
    work: stencila.CreativeWork
  ): HTMLElement => {
    const elem = h(
      'div',
      {
        itemscope: true,
        itemtype: 'http://schema.org/CreativeWork',
        itemprop: 'citation'
      },
      ...(work.authors || []).map(author =>
        author.type === 'Person'
          ? HtmlCodec.encodePerson(author)
          : HtmlCodec.encodeOrganization(author)
      ),
      h('span', { itemprop: 'datePublished' }, work.datePublished),
      h('span', { itemprop: 'title' }, work.title)
    )
    elem.setAttribute('itemtype', 'http://schema.org/CreativeWork')
    return elem
  }

  private static encodePerson = (person: stencila.Person): HTMLElement => {
    const elem = h(
      'span',
      {
        itemscope: true,
        itemtype: 'http://schema.org/Person',
        itemprop: 'author'
      },
      h('span', { itemprop: 'familyName' }, person.familyNames),
      h('span', { itemprop: 'givenName' }, person.givenNames)
    )
    elem.setAttribute('itemtype', 'http://schema.org/Person')
    return elem
  }

  private static encodeOrganization = (
    org: stencila.Organization
  ): HTMLElement => {
    return h('div', org.name)
  }

  /**
   * Encode a Stencila `Include` node to a Microdata `div[itemtype]` element.
   *
   * TODO: This is an initial implementation and it is probably better to generalize
   * it into a default encoding private static to replace `encodeThing`.
   */
  private static encodeInclude = (include: stencila.Include): HTMLElement => {
    const content = include.content || []
    const contentDiv = h('div', content.map(HtmlCodec.encodeNode))
    contentDiv.setAttribute('itemprop', 'content')
    const elem = h(`div`, contentDiv)
    elem.setAttribute(
      'itemtype',
      `https://stencila.github.io/schema/${nodeType(include)}`
    )
    return elem
  }

  /**
   * Decode a `<h1>` etc element to a `stencila.Heading`.
   */
  private static decodeHeading = (
    heading: HTMLHeadingElement,
    depth: number
  ): stencila.Heading => {
    return {
      type: 'Heading',
      depth,
      content: HtmlCodec.decodeInlineChildNodes(heading)
    }
  }

  /**
   * Encode a `stencila.Heading` to a `<h1>` etc element.
   */
  private static encodeHeading = (
    heading: stencila.Heading
  ): HTMLHeadingElement => {
    const content = heading.content.map(HtmlCodec.encodeNode)
    const text = content.reduce(
      (prev, curr) => `${prev}${curr.textContent}`,
      ''
    )
    const id = slugger.slug(text)
    return h(`h${heading.depth}`, { id }, content)
  }

  /**
   * Decode a `<p>` element to a `stencila.Paragraph`.
   */
  private static decodeParagraph = (
    para: HTMLParagraphElement
  ): stencila.Paragraph => {
    return {
      type: 'Paragraph',
      content: HtmlCodec.decodeInlineChildNodes(para)
    }
  }

  /**
   * Encode a `stencila.Paragraph` to a `<p>` element.
   */
  private static encodeParagraph = (
    para: stencila.Paragraph
  ): HTMLParagraphElement => {
    return h('p', para.content.map(HtmlCodec.encodeNode))
  }

  /**
   * Decode a `<blockquote>` element to a `stencila.QuoteBlock`.
   */
  private static decodeBlockquote = (
    elem: HTMLQuoteElement
  ): stencila.QuoteBlock => {
    const quoteBlock: stencila.QuoteBlock = {
      type: 'QuoteBlock',
      content: HtmlCodec.decodeBlockChildNodes(elem)
    }
    const cite = elem.getAttribute('cite')
    if (cite) quoteBlock.citation = cite
    return quoteBlock
  }

  /**
   * Encode a `stencila.QuoteBlock` to a `<blockquote>` element.
   */
  private static encodeQuoteBlock = (
    block: stencila.QuoteBlock
  ): HTMLQuoteElement => {
    return h(
      'blockquote',
      { cite: block.citation },
      block.content.map(HtmlCodec.encodeNode)
    )
  }

  /**
   * Decode a `<pre><code class="language-xxx">` element to a `stencila.CodeBlock`.
   */
  private static decodeCodeBlock = (
    elem: HTMLPreElement
  ): stencila.CodeBlock => {
    const code = elem.querySelector('code')
    if (!code) throw new Error('Woaah, this should never happen!')
    const { language, value } = HtmlCodec.decodeCode(code)
    const codeblock: stencila.CodeBlock = {
      type: 'CodeBlock',
      language,
      value
    }
    const meta = HtmlCodec.decodeDataAttrs(elem)
    if (meta) codeblock.meta = meta
    return codeblock
  }

  /**
   * Encode a `stencila.CodeBlock` to a `<pre><code class="language-xxx">` element.
   *
   * If the `CodeBlock` has a `meta` property, any keys are added as attributes to
   * the `<pre>` element with a `data-` prefix.
   */
  private static encodeCodeBlock = (
    block: stencila.CodeBlock
  ): HTMLPreElement => {
    const attrs = HtmlCodec.encodeDataAttrs(block.meta || {})
    const code = HtmlCodec.encodeCode(block, false)
    return h('pre', attrs, code)
  }

  /**
   * Encode a `stencila.CodeChunk` to a `<stencila-codechunk>` element.
   */
  private static encodeCodeChunk = (chunk: stencila.CodeChunk): HTMLElement => {
    const attrs = HtmlCodec.encodeDataAttrs(chunk.meta || {})

    const codeBlock = HtmlCodec.encodeCodeBlock({
      type: 'CodeBlock',
      value: chunk.text || ''
    })
    // TODO: Until our themes can handle interactive
    codeBlock.setAttribute('style', 'display:none')

    const outputs = h(
      'div',
      { 'data-outputs': true },
      (chunk.outputs || []).map(node => {
        const content = (() => {
          switch (nodeType(node)) {
            case 'string':
              return h('pre', node as string)
            case 'ImageObject':
              return HtmlCodec.encodeImageObject(node as stencila.ImageObject)
            default:
              return HtmlCodec.encodeNode(node)
          }
        })()
        return h('figure', content)
      })
    )

    return h('stencila-codechunk', attrs, codeBlock, outputs)
  }

  /**
   * Decode a `<ul>` or `<ol>` element to a `stencila.List`.
   */
  private static decodeList = (
    list: HTMLUListElement | HTMLOListElement
  ): stencila.List => {
    const order = list.tagName === 'UL' ? 'unordered' : 'ascending'
    return {
      type: 'List',
      order,
      items: [...list.querySelectorAll('li')].map(HtmlCodec.decodeListItem)
    }
  }

  /**
   * Encode a `stencila.List` to a `<ul>` or `<ol>` element.
   */
  private static encodeList = (
    list: stencila.List
  ): HTMLUListElement | HTMLOListElement => {
    return h(
      list.order === 'unordered' ? 'ul' : 'ol',
      list.items.map(HtmlCodec.encodeNode)
    )
  }

  /**
   * Decode a `<li>` element to a `stencila.ListItem`.
   */
  private static decodeListItem = (li: HTMLLIElement): stencila.ListItem => {
    return {
      type: 'ListItem',
      // TODO: Extract the callback
      content: [...li.childNodes].reduce((nodes: stencila.Node[], node) => {
        const decodedNode = HtmlCodec.decodeNode(node)
        return decodedNode !== undefined ? [...nodes, decodedNode] : nodes
      }, [])
    }
  }

  /**
   * Encode a `stencila.ListItem` to a `<li>` element.
   */
  private static encodeListItem = (
    listItem: stencila.ListItem
  ): HTMLLIElement => {
    return h('li', listItem.content.map(HtmlCodec.encodeNode))
  }

  /**
   * Decode a `<table>` element to a `stencila.Table`.
   */
  private static decodeTable = (table: HTMLTableElement): stencila.Table => {
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
                  content: HtmlCodec.decodeInlineChildNodes(cell)
                }
              }
            )
          }
        }
      )
    }
  }

  /**
   * Encode a `stencila.Table` to a `<table>` element.
   */
  private static encodeTable = (table: stencila.Table): HTMLTableElement => {
    return h(
      'table',
      h(
        'tbody',
        table.rows.map(
          (row: stencila.TableRow): HTMLTableRowElement =>
            h(
              'tr',
              row.cells.map(
                (cell: stencila.TableCell): HTMLTableDataCellElement =>
                  h('td', cell.content.map(HtmlCodec.encodeNode))
              )
            )
        )
      )
    )
  }

  /**
   * Decode a HTML `<stencila-datatable>` element to a Stencila `Datatable` node.
   */
  private static decodeDatatable = (elem: HTMLElement): stencila.Datatable => {
    let columns: stencila.DatatableColumn[] = []
    const table = elem.querySelector('table')
    if (table) {
      const thead = table.querySelector('thead')
      if (thead) {
        columns = Array.from(thead.querySelectorAll('tr th')).map(
          (row, index): stencila.DatatableColumn => {
            const th = row.querySelector('th')
            const name = (th && th.innerText) || columnIndexToName(index)
            return {
              type: 'DatatableColumn',
              name,
              values: []
            }
          }
        )
      }

      const tbody = table.querySelector('tbody')
      if (tbody) {
        let rowi = 0
        for (const row of tbody.querySelectorAll('tr')) {
          let coli = 0
          for (const col of row.querySelectorAll('td')) {
            // TODO: Is further parsing e.g. to a number
            // required here?
            columns[coli].values[rowi] = col.innerHTML
            coli += 1
          }
          rowi += 1
        }
      }
    }

    return {
      type: 'Datatable',
      columns
    }
  }

  /**
   * Encode a Stencila `Datatable` node to a HTML `<stencila-datatable>` element.
   *
   * Note: currently this private static is lossy for `DatatableColumn` properties
   * other than `name` and `value` (e.g. `schema`). These could be encoded into
   * the `<thead>`.
   */
  private static encodeDatatable = (
    datatable: stencila.Datatable
  ): HTMLElement => {
    const cols = datatable.columns
    const rows = (cols[0] && cols[0].values.map((_, row) => row)) || []

    // prettier-ignore
    return h('stencila-datatable',
      h('table',
        h('thead',
          h('tr', cols.map(col => (
            h('th', col.name)
          )))
        ),
        h('tbody', rows.map((_, row) => (
          h('tr', cols.map(col => (
            h('td', col.values[row])
          )))
        )))
      )
    )
  }

  /**
   * Decode a `<hr>` element to a `stencila.ThematicBreak`.
   */
  private static decodeHR = (): stencila.ThematicBreak => {
    return { type: 'ThematicBreak' }
  }

  /**
   * Encode a `stencila.ThematicBreak` to a `<hr>` element.
   */
  private static encodeThematicBreak = (): HTMLHRElement => {
    return h('hr')
  }

  /**
   * Decode an inline element e.g `<em>` to a `Mark` node e.g. `Emphasis`.
   */
  private static decodeMark = <Type extends keyof typeof markTypes>(
    elem: HTMLElement,
    type: Type
  ): stencila.Mark => {
    return { type, content: HtmlCodec.decodeInlineChildNodes(elem) }
  }

  /**
   * Encode a `Mark` node to an inline element e.g. `<em>`.
   */
  private static encodeMark = (
    node: stencila.Mark,
    tag: string
  ): HTMLElement => {
    return h(tag, node.content.map(HtmlCodec.encodeNode))
  }

  /**
   * Decode a `<a>` element to a `stencila.Link`.
   */
  private static decodeLink = (elem: HTMLAnchorElement): stencila.Link => {
    const link: stencila.Link = {
      type: 'Link',
      target: elem.getAttribute('href') || '#',
      content: HtmlCodec.decodeInlineChildNodes(elem)
    }
    const meta = HtmlCodec.decodeDataAttrs(elem)
    if (meta) link.meta = meta
    return link
  }

  /**
   * Encode a `stencila.Link` to a `<a>` element.
   */
  private static encodeLink = (link: stencila.Link): HTMLAnchorElement => {
    const attrs = {
      href: link.target,
      ...HtmlCodec.encodeDataAttrs(link.meta || {})
    }
    return h('a', attrs, link.content.map(HtmlCodec.encodeNode))
  }

  /**
   * Decode a `<q>` element to a `stencila.Quote`.
   */
  private static decodeQuote = (elem: HTMLQuoteElement): stencila.Quote => {
    const quote: stencila.Quote = { type: 'Quote', content: [elem.innerHTML] }
    const cite = elem.getAttribute('cite')
    if (cite) quote.citation = cite
    return quote
  }

  /**
   * Encode a `stencila.Quote` to a `<q>` element.
   */
  private static encodeQuote = (quote: stencila.Quote): HTMLQuoteElement => {
    return h('q', { cite: quote.citation }, quote.content)
  }

  /**
   * Decode a `<code>` element to a `stencila.Code`.
   */
  private static decodeCode = (elem: HTMLElement): stencila.Code => {
    const code: stencila.Code = { type: 'Code', value: elem.textContent || '' }
    const clas = elem.getAttribute('class')
    if (clas) {
      const match = clas.match(/^language-(\w+)$/)
      if (match) {
        code.language = match[1]
      }
    }
    const meta = HtmlCodec.decodeDataAttrs(elem)
    if (meta) code.meta = meta
    return code
  }

  /**
   * Encode a `stencila.Code` to a `<code>` element.
   */
  private static encodeCode = (
    code: stencila.Code,
    dataAttrs: boolean = true
  ): HTMLElement => {
    return h('code', {
      class: code.language ? `language-${code.language}` : undefined,
      innerHTML: escape(code.value),
      ...(dataAttrs ? HtmlCodec.encodeDataAttrs(code.meta || {}) : {})
    })
  }

  /**
   * Decode a HTML `<img>` element to a Stencila `ImageObject`.
   */
  private static decodeImage = (
    elem: HTMLImageElement
  ): stencila.ImageObject => {
    const image: stencila.ImageObject = {
      type: 'ImageObject',
      contentUrl: elem.src
    }
    if (elem.title) image.title = elem.title
    if (elem.alt) image.text = elem.alt
    return image
  }

  /**
   * Encode a Stencila `ImageObject` to a HTML `<img>` element.
   */
  private static encodeImageObject = (
    image: stencila.ImageObject
  ): HTMLImageElement => {
    return h('img', {
      src: image.contentUrl,
      title: image.title,
      alt: image.text
    })
  }

  /**
   * Encode a Stencila `Math` node to a HTML `<math>` element.
   */
  private static encodeMath = (math: any): HTMLElement => {
    return h('math', { innerHTML: math.text })
  }

  /**
   * Decode a `<stencila-null>` element to a `null`.
   */
  private static decodeNull = (elem: HTMLElement): null => {
    return null
  }

  /**
   * Encode a `null` to a `<stencila-null>` element.
   */
  private static encodeNull = (value: null): HTMLElement => {
    return h('stencila-null', 'null')
  }

  /**
   * Decode a `<stencila-boolean>` element to a `boolean`.
   */
  private static decodeBoolean = (elem: HTMLElement): boolean => {
    return elem.innerHTML === 'true'
  }

  /**
   * Encode a `boolean` to a `<stencila-boolean>` element.
   */
  private static encodeBoolean = (value: boolean): HTMLElement => {
    return h('stencila-boolean', value === true ? 'true' : 'false')
  }

  /**
   * Decode a `<stencila-number>` element to a `number`.
   */
  private static decodeNumber = (elem: HTMLElement): number => {
    return parseFloat(elem.innerHTML || '0')
  }

  /**
   * Encode a `number` to a `<stencila-number>` element.
   */
  private static encodeNumber = (value: number): HTMLElement => {
    return h('stencila-number', value.toString())
  }

  /**
   * Decode a `<stencila-array>` element to a `array`.
   */
  private static decodeArray = (elem: HTMLElement): any[] => {
    return JSON5.parse(elem.innerHTML || '[]')
  }

  /**
   * Encode a `array` to a `<stencila-array>` element.
   */
  private static encodeArray = (value: any[]): HTMLElement => {
    return h('stencila-array', JSON5.stringify(value))
  }

  /**
   * Decode a `<stencila-object>` element to a `object`.
   */
  private static decodeObject = (elem: HTMLElement): object => {
    return JSON5.parse(elem.innerHTML || '{}')
  }

  /**
   * Encode a `object` to a `<stencila-object>` element.
   */
  private static encodeObject = (value: object): HTMLElement => {
    return h('stencila-object', JSON5.stringify(value))
  }

  /**
   * Decode a `<stencila-thing>` element to a `Thing`.
   */
  private static decodeThing = (elem: HTMLElement): stencila.Thing => {
    return JSON5.parse(elem.innerHTML || '{}')
  }

  /**
   * Encode a `Thing` to a `<stencila-thing>` element.
   */
  private static encodeThing = (thing: stencila.Thing): HTMLElement => {
    return h('stencila-thing', JSON5.stringify(thing))
  }

  /**
   * Decode a `#text` node to a `string`.
   */
  private static decodeText = (text: Text): string => {
    return text.data
  }

  /**
   * Encode a `string` to a `#text` node.
   */
  private static encodeString = (value: string): Text => {
    return doc.createTextNode(escape(value))
  }

  /**
   * Decode the `data-` attributes of an element into a dictionary
   * of strings.
   */
  private static decodeDataAttrs = (
    elem: HTMLElement
  ): { [key: string]: string } | undefined => {
    const dict: { [key: string]: string } = {}
    Array.from(elem.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .forEach(attr => (dict[attr.name.slice(5)] = attr.value))
    return Object.keys(dict).length ? dict : undefined
  }

  /**
   * Encode a dictionary of strings to `data-` attributes to add to
   * an element (the inverse of `decodeDataAttrs`).
   */
  private static encodeDataAttrs = (meta: { [key: string]: string }) => {
    const attrs: { [key: string]: string } = {}
    for (const [key, value] of Object.entries(meta)) {
      attrs['data-' + key] = value
    }
    return attrs
  }
}
