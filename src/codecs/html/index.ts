/**
 * @module html
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import {
  isArticle,
  isCreativeWork,
  markTypes,
  nodeType
} from '@stencila/schema/dist/util'
import { themePath, themes } from '@stencila/thema'
import collapse from 'collapse-whitespace'
import escape from 'escape-html'
import { flatten, isNonEmpty } from 'fp-ts/lib/Array'
import fs from 'fs'
// @ts-ignore
import GithubSlugger from 'github-slugger'
import h from 'hyperscript'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import jsdom from 'jsdom'
import JSON5 from 'json5'
import path from 'path'
import { columnIndexToName } from '../../codecs/xlsx'
import { compactObj, isDefined, reduceNonNullable } from '../../util'
import bundle from '../../util/bundle'
import * as vfile from '../../util/vfile'
import { Codec, defaultEncodeOptions, GlobalEncodeOptions } from '../types'

const window = new jsdom.JSDOM().window
const document = window.document

const log = getLogger('encoda:html')

// Ensures unique `id` attributes (e.g. for headings)
const slugger = new GithubSlugger()

/**
 * Given a possibly undefined property, will return the HTML provided as the second argument if `prop` is truthy,
 * otherwise returns undefined.
 * @param {unknown} prop - Any possibly falsy value, most often an optional Stencila Schema node property
 * @param {HTMLElement} htmlContent - HTMLElement, usually a direct call to `hyperscript`
 */
const optionalHTML = (
  prop: unknown = undefined,
  htmlContent: HTMLElement
): HTMLElement | undefined => (prop ? htmlContent : undefined)

/**
 * Given a string tries to find and return an HTML element with a matching `itemprop` attribute value
 * @param {HTMLElement} el - HTML element to search within
 * @param {string} itemprop - Value of the `itemprop` attribute to find
 */
const propSelector = (el: HTMLElement) => (
  itemprop: string
): HTMLElement | undefined => {
  const match = el.querySelector<HTMLElement>(`[itemprop=${itemprop}]`)
  return match || undefined
}

/**
 * Given a string tries to find and return all HTML element with a matching `itemprop` attribute valu
 * @param {HTMLElement} el - HTML element to search within
 * @param {string} itemprop - Value of the `itemprop` attribute to find
 */
const propSelectorAll = (el: HTMLElement) => (
  itemprop: string
): HTMLElement[] => {
  const match = el.querySelectorAll<HTMLElement>(`[itemprop=${itemprop}]`)
  return [...match] || []
}

/**
 * Given a string tries to find and return an HTML element with a matching `itemprop` attribute value.
 * If a matching element is found, will attempt to return the `textContent`, falling back to `undefined`.
 * @param {HTMLElement} el - HTML element to search within
 * @param {string} itemprop - Value of the `itemprop` attribute to find
 */
const propValue = (el: HTMLElement) => (
  itemprop: string
): string | undefined => {
  const match = propSelector(el)(itemprop)
  const value = match ? match.textContent : undefined
  return value || undefined
}

/**
 * Given a list of itemprop values, tries to find and return the matching HTML element's `textContent`.
 * If the found HTMLElement does not contain `textContent`, then `undefined` will be returned for that element.
 * @param {HTMLElement} el - HTML element to search within
 * @param {string} itemprops - Value of the `itemprop` attribute to find
 */
const propsToValues = (el: HTMLElement) => (
  itemprops: string[]
): { [key: string]: string | number } => {
  const selector = propSelector(el)

  return itemprops.reduce(
    (foundProps: { [key: string]: string | number }, prop) => {
      const match = selector(prop)
      const value = match && match.textContent

      return value ? { ...foundProps, [prop]: value } : foundProps
    },
    {}
  )
}

export class HTMLCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/html']

  /**
   * Decode a `VFile` with HTML contents to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const html = await vfile.dump(file)
    const dom = new jsdom.JSDOM(html)
    const document = dom.window.document
    collapse(document)
    const node = decodeNode(document)
    if (!node) throw new Error(`Unable to decode HTML`)
    return node
  }

  /**
   * Encode a `stencila.Node` to a `VFile` with HTML contents.
   *
   * @param node The `stencila.Node` to encode. Will be mutated to an `Node`.
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    options: GlobalEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    const {
      isStandalone = true,
      isBundle = false,
      theme = themes.stencila
    } = options

    // Reset the slugger to avoid unnecessarily adding numbers to ids
    // in order to make them unique
    slugger.reset()

    const nodeToEncode = isBundle ? await bundle(node) : node
    let dom: HTMLHtmlElement = encodeNode(nodeToEncode, {
      isStandalone,
      theme
    }) as HTMLHtmlElement

    if (isStandalone) {
      const { title, ...metadata } = getArticleMetaData(node)
      dom = generateHtmlElement(title, metadata, [dom], options)
    }

    const beautifulHtml = beautify(dom.outerHTML)
    return vfile.load(beautifulHtml)
  }
}

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

function decodeNode(node: Node): stencila.Node | undefined {
  const type =
    node instanceof window.HTMLElement
      ? node.getAttribute('itemtype')
      : undefined

  const name =
    type && type.includes('schema:') ? type : node.nodeName.toLowerCase()

  switch (name) {
    case '#document':
      return decodeDocument(node as HTMLDocument)

    case 'article':
      return decodeArticle(node as HTMLElement)

    case 'div':
    case 'span':
    case 'time':
      return decodeDiv(node as HTMLDivElement)

    case 'p':
      return decodeParagraph(node as HTMLParagraphElement)
    case 'blockquote':
      return decodeBlockquote(node as HTMLQuoteElement)
    case 'pre':
      if (node.firstChild && node.firstChild.nodeName === 'CODE') {
        return decodeCodeBlock(node as HTMLPreElement)
      }
      break
    case 'ul':
      return decodeList(node as HTMLUListElement)
    case 'ol':
      return decodeList(node as HTMLOListElement)
    case 'schema:Collection':
      return decodeCollection(node as HTMLOListElement)
    case 'li':
      return decodeListItem(node as HTMLLIElement)
    case 'table':
      return decodeTable(node as HTMLTableElement)
    case 'stencila-datatable':
      return decodeDatatable(node as HTMLDivElement)
    case 'hr':
      return decodeHR(node as HTMLHRElement)

    case 'em':
      return decodeMark(node as HTMLElement, 'Emphasis')
    case 'strong':
      return decodeMark(node as HTMLElement, 'Strong')
    case 'del':
      return decodeMark(node as HTMLElement, 'Delete')
    case 'sup':
      return decodeMark(node as HTMLElement, 'Superscript')
    case 'sub':
      return decodeMark(node as HTMLElement, 'Subscript')
    case 'a':
      return decodeLink(node as HTMLAnchorElement)
    case 'q':
      return decodeQuote(node as HTMLQuoteElement)
    case 'cite':
      return decodeCite(node as HTMLElement)
    case 'schema:CiteGroup':
      return decodeCiteGroup(node as HTMLOListElement)
    case 'code':
      return decodeCode(node as HTMLElement)
    case 'img':
      return decodeImage(node as HTMLImageElement)
    case 'figure':
      return decodeFigure(node as HTMLElement)
    case 'figcaption':
      return decodeFigCaption(node as HTMLElement)

    case 'stencila-null':
      return decodeNull(node as HTMLElement)
    case 'stencila-boolean':
      return decodeBoolean(node as HTMLElement)
    case 'stencila-number':
      return decodeNumber(node as HTMLElement)
    case 'stencila-array':
      return decodeArray(node as HTMLElement)
    case 'stencila-object':
      return decodeObject(node as HTMLElement)
    case 'stencila-thing':
      return decodeThing(node as HTMLElement)

    case 'script':
      return undefined

    case '#text':
      return decodeText(node as Text)
  }

  const match = name.match(/^h(\d)$/)
  if (match) {
    return decodeHeading(node as HTMLHeadingElement, parseInt(match[1], 10))
  }

  log.warn(`No handler for HTML element <${name}>`)
  return undefined
}

const encodeNode = (node: stencila.Node, options: {} = {}): Node => {
  switch (nodeType(node)) {
    case 'Article':
      return encodeArticle(node as stencila.Article)

    case 'Include':
      return encodeInclude(node as stencila.Include)

    case 'Heading':
      return encodeHeading(node as stencila.Heading)
    case 'Paragraph':
      return encodeParagraph(node as stencila.Paragraph)
    case 'QuoteBlock':
      return encodeQuoteBlock(node as stencila.QuoteBlock)
    case 'Cite':
      return encodeCite(node as stencila.Cite)
    case 'CiteGroup':
      return encodeCiteGroup(node as stencila.CiteGroup)
    case 'CodeBlock':
      return encodeCodeBlock(node as stencila.CodeBlock)
    case 'CodeChunk':
      return encodeCodeChunk(node as stencila.CodeChunk)
    case 'CodeExpression':
      return encodeCodeExpression(node as stencila.CodeExpression)
    case 'Collection':
      return encodeCollection(node as stencila.Collection)
    case 'Figure':
      return encodeFigure(node as stencila.Figure)
    case 'List':
      return encodeList(node as stencila.List)
    case 'ListItem':
      return encodeListItem(node as stencila.ListItem)
    case 'Table':
      return encodeTable(node as stencila.Table)
    case 'Datatable':
      return encodeDatatable(node as stencila.Datatable)
    case 'ThematicBreak':
      return encodeThematicBreak(node as stencila.ThematicBreak)

    case 'Emphasis':
      return encodeMark(node as stencila.Emphasis, 'em')
    case 'Strong':
      return encodeMark(node as stencila.Strong, 'strong')
    case 'Delete':
      return encodeMark(node as stencila.Strong, 'del')
    case 'Superscript':
      return encodeMark(node as stencila.Superscript, 'sup')
    case 'Subscript':
      return encodeMark(node as stencila.Subscript, 'sub')
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'Quote':
      return encodeQuote(node as stencila.Quote)
    case 'Code':
      return encodeCode(node as stencila.Code)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
    case 'Math':
      return encodeMath(node as object)

    case 'null':
      return encodeNull(node as null)
    case 'boolean':
      return encodeBoolean(node as boolean)
    case 'number':
      return encodeNumber(node as number)
    case 'string':
      return encodeString(node as string)
    case 'array':
      return encodeArray(node as unknown[])
    case 'object':
      return encodeObject(node as object)
    default:
      return encodeThing(node as stencila.Thing)
  }
}

function decodeBlockChildNodes(node: Node): stencila.BlockContent[] {
  return Array.from(node.childNodes)
    .reduce(reduceNonNullable(decodeNode), [])
    .map(n => n as stencila.BlockContent)
}

function decodeInlineChildNodes(node: Node): stencila.InlineContent[] {
  return [...node.childNodes].map(
    child => decodeNode(child) as stencila.InlineContent
  )
}

/**
 * Decode a `#document` node to a `stencila.Node`.
 */
function decodeDocument(doc: HTMLDocument): stencila.Node {
  const head = doc.querySelector('head')
  if (!head) throw new Error('Document does not have a <head>!')

  const body = doc.querySelector('body')
  if (!body) throw new Error('Document does not have a <body>!')

  const jsonld = head.querySelector('script[type="application/ld+json"]')
  const metadata = jsonld ? JSON.parse(jsonld.innerHTML || '{}') : {}
  delete metadata['@context']

  if (!jsonld && body.childElementCount === 1) {
    const node = decodeNode(body.children[0])
    if (!node) throw new Error(`Top level node is not defined`)
    return node
  }

  // TODO: Allow for the different types of creative work based on type in
  // the jsonld
  return {
    type: 'Article',
    ...metadata,
    content: decodeBlockChildNodes(body)
  }
}

/**
 * Decode a `<div>` node to a Stencila `Node`.
 *
 * A `<div>` is treated as having no semantic meaning
 * and so this function decodes it's children.
 */
function decodeDiv(div: HTMLDivElement): stencila.Node | undefined {
  return [...div.childNodes].map(decodeNode)
}

/**
 * Generate a `<html>` element with supplied title, metadata, body content, and
 * optionally custom CSS to style the document with.
 */
function generateHtmlElement(
  title: string = 'Untitled',
  metadata: { [key: string]: any } = {},
  body: Node[] = [],
  options: GlobalEncodeOptions = defaultEncodeOptions
): HTMLHtmlElement {
  const { isBundle = false, theme } = options

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
      innerHTML: fs.readFileSync(path.join(themePath, 'styles.css')).toString()
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

    const themeBaseUrl = `https://unpkg.com/@stencila/thema@${themaVersion}/${themePath}/${theme}`
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
      '@context': 'https://stencila.github.io/schema/stencila.jsonld',
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
const decodeArticle = (element: HTMLElement): stencila.Article => {
  const titleEl = element.querySelector('h1[role=title]')
  const title = titleEl ? titleEl.innerHTML : 'Untitled'
  const references = element.querySelectorAll<HTMLOListElement>(
    'ol[itemprop="references"] > li'
  )

  const refItems = references ? [...references].map(decodeCreativeWork) : []

  if (titleEl) titleEl.remove()

  return compactObj({
    type: 'Article',
    title,
    authors: [],
    references: isNonEmpty(refItems) ? refItems : undefined,
    content: [...element.childNodes].reduce(reduceNonNullable(decodeNode), [])
  })
}

/**
 * Encode an `Article` node to a `<article>` element.
 */
function encodeArticle(article: stencila.Article): HTMLElement {
  const { type, title, content, references, ...rest } = article

  const titleEl = h('h1', title)
  titleEl.setAttribute('role', 'title')
  const elements = content ? content.map(encodeNode) : []
  const refs = references ? encodeReferences(references) : []
  return h('article', titleEl, ...elements, refs)
}

function encodeReferences(
  references: (string | stencila.CreativeWork)[]
): HTMLElement {
  return h(
    'section',
    h('h2', 'References'),
    h(
      'ol',
      { attrs: { itemprop: 'references' } },
      references.map(encodeReference)
    )
  )
}

function encodeReference(
  reference: string | stencila.CreativeWork
): HTMLElement {
  return typeof reference === 'string'
    ? h('li', reference)
    : encodeCreativeWork(reference, {
        attrs: { itemprop: 'citation' },
        as: 'li'
      })
}

interface CreativeWorkOptions {
  attrs?: { [key: string]: unknown }
  as?: keyof HTMLElementTagNameMap
}

const defaultCreativeWorkOptions: CreativeWorkOptions = {
  attrs: {}
}

type CreativeWOrkTagMap = {
  [key in stencila.CreativeWork['type']]: keyof HTMLElementTagNameMap
}

const creativeWorkTagMap: CreativeWOrkTagMap = {
  Article: 'article',
  AudioObject: 'audio',
  CodeChunk: 'pre',
  CodeExpr: 'pre',
  Collection: 'div',
  CreativeWork: 'div',
  Datatable: 'div',
  Figure: 'figure',
  ImageObject: 'div',
  MediaObject: 'div',
  Periodical: 'div',
  PublicationIssue: 'div',
  PublicationVolume: 'div',
  SoftwareApplication: 'div',
  SoftwareSourceCode: 'div',
  Table: 'div',
  VideoObject: 'video'
}

function decodeCreativeWork(work: HTMLElement): stencila.CreativeWork {
  const workSelectorAll = propSelectorAll(work)
  const workSelector = propSelector(work)
  const url = workSelector('url')

  return {
    type: 'CreativeWork',
    authors: workSelectorAll('author').map(decodePerson),
    funders: workSelectorAll('funder').map(decodePerson),
    editors: workSelectorAll('editor').map(decodePerson),
    url: url ? url.getAttribute('href') || undefined : undefined,
    ...propsToValues(work)([
      'dateCreated',
      'dateModified',
      'datePublished',
      'title'
    ])
  }
}

function encodeCreativeWork(
  work: stencila.CreativeWork,
  { attrs, as }: CreativeWorkOptions = defaultCreativeWorkOptions
): HTMLElement {
  const elem = h(
    as || creativeWorkTagMap[work.type] || 'div',
    {
      attrs: {
        itemscope: true,
        itemtype: 'https://schema.org/CreativeWork',
        ...attrs
      },
      id: work.id
    },
    h(
      work.url ? 'a' : 'span',
      { attrs: { itemprop: 'title', itemscope: true }, href: work.url },
      work.title
    ),
    h(
      'ol',
      { attrs: { itemprop: 'authors', itemscope: true } },
      ...(work.authors || []).map(author =>
        author.type === 'Person'
          ? encodePerson(author, 'li')
          : encodeOrganization(author, 'li')
      )
    ),
    h(
      'time',
      { itemprop: 'datePublished', datetime: work.datePublished },
      work.datePublished
    ),
    optionalHTML(
      work.url,
      h('a', { attrs: { itemprop: 'url' }, href: work.url }, work.url)
    ),
    (work.content || []).map(encodeNode)
  )

  return elem
}

function decodePerson(person: HTMLElement): stencila.Person {
  const url = person.querySelector('a')
  const href = url && url.getAttribute('href')
  const personProps = propValue(person)

  return {
    type: 'Person',
    url: href || undefined,
    familyNames: [personProps('familyName')].filter(isDefined),
    givenNames: [personProps('givenName')].filter(isDefined)
  }
}

function encodePerson(
  person: stencila.Person,
  as?: keyof HTMLElementTagNameMap
): HTMLElement {
  const name = [
    h('span', { itemprop: 'familyName' }, person.familyNames),
    h('span', { itemprop: 'givenName' }, person.givenNames)
  ]

  const elem = h(
    as || 'span',
    {
      attrs: {
        itemscope: true,
        itemtype: 'https://schema.org/Person',
        itemprop: 'author'
      }
    },
    person.url ? h('a', { href: person.url }, ...name) : name
  )

  return elem
}

function encodeOrganization(
  org: stencila.Organization,
  as?: keyof HTMLElementTagNameMap
): HTMLElement {
  return h(
    as || 'div',
    org.url ? h('a', { href: org.url }, org.name) : org.name
  )
}

/**
 * Encode a Stencila `Include` node to a Microdata `div[itemtype]` element.
 *
 * TODO: This is an initial implementation and it is probably better to generalize
 * it into a default encoding function to replace `encodeThing`.
 */
function encodeInclude(include: stencila.Include): HTMLElement {
  const content = include.content || []
  const contentDiv = h('div', content.map(encodeNode))
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
function decodeHeading(
  heading: HTMLHeadingElement,
  depth: number
): stencila.Heading {
  return { type: 'Heading', depth, content: decodeInlineChildNodes(heading) }
}

/**
 * Encode a `stencila.Heading` to a `<h1>` etc element.
 */
function encodeHeading(heading: stencila.Heading): HTMLHeadingElement {
  const content = heading.content.map(encodeNode)
  const text = content.reduce((prev, curr) => `${prev}${curr.textContent}`, '')
  const id = slugger.slug(text)
  return h(`h${heading.depth}`, { id }, content)
}

/**
 * Decode a `<p>` element to a `stencila.Paragraph`.
 */
function decodeParagraph(para: HTMLParagraphElement): stencila.Paragraph {
  return { type: 'Paragraph', content: decodeInlineChildNodes(para) }
}

/**
 * Encode a `stencila.Paragraph` to a `<p>` element.
 */
function encodeParagraph(para: stencila.Paragraph): HTMLParagraphElement {
  return h('p', para.content.map(encodeNode))
}

/**
 * Decode a `<blockquote>` element to a `stencila.QuoteBlock`.
 */
function decodeBlockquote(elem: HTMLQuoteElement): stencila.QuoteBlock {
  const quoteBlock: stencila.QuoteBlock = {
    type: 'QuoteBlock',
    content: decodeBlockChildNodes(elem)
  }
  const cite = elem.getAttribute('cite')
  if (cite) quoteBlock.cite = cite
  return quoteBlock
}

/**
 * Encode a `stencila.QuoteBlock` to a `<blockquote>` element.
 */
function encodeQuoteBlock(block: stencila.QuoteBlock): HTMLQuoteElement {
  return h('blockquote', { cite: block.cite }, block.content.map(encodeNode))
}

// Regex to test if a string is a URL. Thanks to https://stackoverflow.com/a/3809435
var urlRegex = new RegExp(
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi
)

const decodeHref = (href?: string | null): string => {
  if (!isDefined(href)) return '#'
  return href.startsWith('#') ? href.substring(1) : href
}

const encodeHref = (href?: string | null): string => {
  if (!isDefined(href)) return '#'
  return href.startsWith('#') || urlRegex.test(href) ? href : `#${href}`
}

/**
 * Decode a `<cite>` element to a `stencila.Cite`.
 */
function decodeCite(elem: HTMLElement): stencila.Cite {
  const target = elem.querySelector('a')
  const prefix = elem.querySelector('[itemprop="citePrefix"]')
  const suffix = elem.querySelector('[itemprop="citeSuffix"]')

  return {
    type: 'Cite',
    target: decodeHref(target ? target.getAttribute('href') : '#'),
    prefix: isDefined(prefix) ? prefix.textContent || '' : undefined,
    suffix: isDefined(suffix) ? suffix.textContent || '' : undefined
  }
}

/**
 * Encode a `stencila.Cite` to a `<cite>` element.
 */
function encodeCite(cite: stencila.Cite): HTMLElement {
  const content = [
    optionalHTML(
      cite.prefix,
      h('span', { itemprop: 'citePrefix' }, [cite.prefix])
    ),
    h('a', { href: encodeHref(cite.target) }, cite.target),
    optionalHTML(
      cite.suffix,
      h('span', { itemprop: 'citeSuffix' }, [cite.suffix])
    )
  ].filter(isDefined)

  return h('cite', content)
}

/**
 * Decode a `<ol itemtype="schema:CiteGroup">` element to a `stencila.CiteGroup`.
 */
function decodeCiteGroup(citeGroup: HTMLOListElement): stencila.CiteGroup {
  return {
    type: 'CiteGroup',
    items: [...citeGroup.querySelectorAll<HTMLElement>('cite')].map(decodeCite)
  }
}

/**
 * Encode a `stencila.CiteGroup` element to a `<ol itemtype="schema:CiteGroup">`.
 */
function encodeCiteGroup(citeGroup: stencila.CiteGroup): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'schema:CiteGroup' } },
    citeGroup.items.map(encodeCite)
  )
}

/**
 * Decode a `<figure>` element to a `stencila.Figure`.
 */
function decodeFigure(elem: HTMLElement): stencila.Figure {
  const content = [...elem.childNodes]
    .filter(n => n.nodeName.toLowerCase() !== 'figcaption')
    .reduce(reduceNonNullable(decodeNode), [])

  const caption = elem.querySelector('figcaption')

  return {
    type: 'Figure',
    id: elem.getAttribute('id') || undefined,
    content,
    caption: caption ? decodeFigCaption(caption) : undefined
  }
}

/**
 * Decode a `<figcaption>` element to a list of `stencila.Node`s.
 */
function decodeFigCaption(elem: HTMLElement): stencila.Node[] {
  return [...elem.childNodes].reduce(reduceNonNullable(decodeNode), [])
}

/**
 * Encode a `stencila.Figure` element to a `<figure>`.
 */
function encodeFigure(figure: stencila.Figure): HTMLElement {
  return h('figure', { id: figure.id, title: figure.label }, [
    encodeCreativeWork(figure),
    figure.caption ? h('figcaption', figure.caption.map(encodeNode)) : undefined
  ])
}

/**
 * Decode a `<ol itemtype="schema:Collection">` element to a `stencila.Collection`.
 */
function decodeCollection(collection: HTMLOListElement): stencila.Collection {
  const parts = flatten(
    ([...collection.childNodes] || []).map(part =>
      ([...part.childNodes] || []).map(decodeNode)
    )
  ).filter(isCreativeWork)

  return {
    type: 'Collection',
    parts
  }
}

/**
 * Encode a `<ol itemtype="schema:Collection">` element to a `stencila.Collection`.
 */
function encodeCollection(collection: stencila.Collection): HTMLOListElement {
  return h(
    'ol',
    { attrs: { itemtype: 'schema:Collection' } },
    collection.parts.map(entry => h('li', encodeCreativeWork(entry)))
  )
}

/**
 * Decode a `<pre><code class="language-xxx">` element to a `stencila.CodeBlock`.
 */
function decodeCodeBlock(elem: HTMLPreElement): stencila.CodeBlock {
  const code = elem.querySelector('code')
  if (!code) throw new Error('Woaah, this should never happen!')
  const { programmingLanguage, text } = decodeCode(code)
  const codeblock: stencila.CodeBlock = {
    type: 'CodeBlock',
    programmingLanguage,
    text
  }
  const meta = decodeDataAttrs(elem)
  if (meta) codeblock.meta = meta
  return codeblock
}

/**
 * Encode a `stencila.CodeBlock` to a `<pre><code class="language-xxx">` element.
 *
 * If the `CodeBlock` has a `meta` property, any keys are added as attributes to
 * the `<pre>` element with a `data-` prefix.
 */
function encodeCodeBlock(block: stencila.CodeBlock): HTMLPreElement {
  const attrs = encodeDataAttrs(block.meta || {})
  const code = encodeCode(block, false)
  return h('pre', attrs, code)
}

function encodeCodeOutput(node: stencila.Node) {
  const content = (() => {
    switch (nodeType(node)) {
      case 'string':
        return h('pre', node as string)
      case 'ImageObject':
        return encodeImageObject(node as stencila.ImageObject)
      default:
        return encodeNode(node)
    }
  })()
  return h('figure', content)
}

/**
 * Encode a `stencila.CodeChunk` to a `<stencila-codechunk>` element.
 */
function encodeCodeChunk(chunk: stencila.CodeChunk): HTMLElement {
  const attrs = encodeDataAttrs(chunk.meta || {})

  const codeBlock = encodeCodeBlock({
    type: 'CodeBlock',
    text: chunk.text || ''
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
            return encodeImageObject(node as stencila.ImageObject)
          default:
            return encodeNode(node)
        }
      })()
      return h('figure', content)
    })
  )

  return h('stencila-codechunk', attrs, codeBlock, outputs)
}

/**
 * Encode a `stencila.CodeExpression to a `<stencila-codeexpression>` element.
 */
function encodeCodeExpression(expr: stencila.CodeExpression): HTMLElement {
  const attrs = encodeDataAttrs(expr.meta || {})
  attrs['text'] = expr.text
  if (expr.programmingLanguage) attrs['language'] = expr.programmingLanguage
  return h(
    'stencila-codeexpression',
    attrs,
    encodeCodeOutput(expr.output || '')
  )
}

/**
 * Decode a `<ul>` or `<ol>` element to a `stencila.List`.
 */
function decodeList(list: HTMLUListElement | HTMLOListElement): stencila.List {
  const order = list.tagName === 'UL' ? 'unordered' : 'ascending'
  return {
    type: 'List',
    order,
    items: [...list.querySelectorAll('li')].map(decodeListItem)
  }
}

/**
 * Encode a `stencila.List` to a `<ul>` or `<ol>` element.
 */
function encodeList(list: stencila.List): HTMLUListElement | HTMLOListElement {
  return h(list.order === 'unordered' ? 'ul' : 'ol', list.items.map(encodeNode))
}

/**
 * Decode a `<li>` element to a `stencila.ListItem`.
 */
function decodeListItem(li: HTMLLIElement): stencila.ListItem {
  return {
    type: 'ListItem',
    content: [...li.childNodes].reduce(reduceNonNullable(decodeNode), [])
  }
}

/**
 * Encode a `stencila.ListItem` to a `<li>` element.
 */
function encodeListItem(listItem: stencila.ListItem): HTMLLIElement {
  return h('li', listItem.content.map(encodeNode))
}

/**
 * Decode a `<table>` element to a `stencila.Table`.
 */
function decodeTable(table: HTMLTableElement): stencila.Table {
  return compactObj({
    type: 'Table',
    id: table.getAttribute('id') || undefined,
    rows: Array.from(table.querySelectorAll('tr')).map(
      (row: HTMLTableRowElement): stencila.TableRow => {
        return {
          type: 'TableRow',
          cells: Array.from(row.querySelectorAll('td')).map(
            (cell: HTMLTableDataCellElement): stencila.TableCell => {
              return {
                type: 'TableCell',
                content: decodeInlineChildNodes(cell)
              }
            }
          )
        }
      }
    )
  })
}

/**
 * Encode a `stencila.Table` to a `<table>` element.
 */
function encodeTable(table: stencila.Table): HTMLTableElement {
  return h(
    'table',
    { id: table.id },
    h(
      'tbody',
      table.rows.map(
        (row: stencila.TableRow): HTMLTableRowElement => {
          return h(
            'tr',
            row.cells.map(
              (cell: stencila.TableCell): HTMLTableDataCellElement => {
                return h('td', cell.content.map(encodeNode))
              }
            )
          )
        }
      )
    )
  )
}

/**
 * Decode a HTML `<stencila-datatable>` element to a Stencila `Datatable` node.
 */
function decodeDatatable(elem: HTMLElement): stencila.Datatable {
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
 * Note: currently this function is lossy for `DatatableColumn` properties
 * other than `name` and `value` (e.g. `schema`). These could be encoded into
 * the `<thead>`.
 */
function encodeDatatable(datatable: stencila.Datatable): HTMLElement {
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
function decodeHR(hr: HTMLHRElement): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Encode a `stencila.ThematicBreak` to a `<hr>` element.
 */
function encodeThematicBreak(tb: stencila.ThematicBreak): HTMLHRElement {
  return h('hr')
}

/**
 * Decode an inline element e.g `<em>` to a `Mark` node e.g. `Emphasis`.
 */
function decodeMark<Type extends keyof typeof markTypes>(
  elem: HTMLElement,
  type: Type
): stencila.Mark {
  return { type, content: decodeInlineChildNodes(elem) }
}

/**
 * Encode a `Mark` node to an inline element e.g. `<em>`.
 */
function encodeMark(node: stencila.Mark, tag: string): HTMLElement {
  return h(tag, node.content.map(encodeNode))
}

/**
 * Decode a `<a>` element to a `stencila.Link`.
 */
function decodeLink(elem: HTMLAnchorElement): stencila.Link {
  const link: stencila.Link = {
    type: 'Link',
    target: elem.getAttribute('href') || '#',
    content: decodeInlineChildNodes(elem)
  }
  const meta = decodeDataAttrs(elem)
  if (meta) link.meta = meta
  return link
}

/**
 * Encode a `stencila.Link` to a `<a>` element.
 */
function encodeLink(link: stencila.Link): HTMLAnchorElement {
  const attrs = {
    href: link.target,
    ...encodeDataAttrs(link.meta || {})
  }
  return h('a', attrs, link.content.map(encodeNode))
}

/**
 * Decode a `<q>` element to a `stencila.Quote`.
 */
function decodeQuote(elem: HTMLQuoteElement): stencila.Quote {
  const quote: stencila.Quote = { type: 'Quote', content: [elem.innerHTML] }
  const cite = elem.getAttribute('cite')
  if (cite) quote.cite = cite
  return quote
}

/**
 * Encode a `stencila.Quote` to a `<q>` element.
 */
function encodeQuote(quote: stencila.Quote): HTMLQuoteElement {
  return h('q', { cite: quote.cite }, quote.content)
}

/**
 * Decode a `<code>` element to a `stencila.Code`.
 */
function decodeCode(elem: HTMLElement): stencila.Code {
  const code: stencila.Code = { type: 'Code', text: elem.textContent || '' }
  const clas = elem.getAttribute('class')
  if (clas) {
    const match = clas.match(/^language-(\w+)$/)
    if (match) {
      code.programmingLanguage = match[1]
    }
  }
  const meta = decodeDataAttrs(elem)
  if (meta) code.meta = meta
  return code
}

/**
 * Encode a `stencila.Code` to a `<code>` element.
 */
function encodeCode(
  code: stencila.Code,
  dataAttrs: boolean = true
): HTMLElement {
  return h('code', {
    class: code.programmingLanguage
      ? `language-${code.programmingLanguage}`
      : undefined,
    innerHTML: escape(code.text),
    ...(dataAttrs ? encodeDataAttrs(code.meta || {}) : {})
  })
}

/**
 * Decode a HTML `<img>` element to a Stencila `ImageObject`.
 */
function decodeImage(elem: HTMLImageElement): stencila.ImageObject {
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
function encodeImageObject(image: stencila.ImageObject): HTMLImageElement {
  return h('img', {
    src: image.contentUrl,
    title: image.title,
    alt: image.text
  })
}

/**
 * Encode a Stencila `Math` node to a HTML `<math>` element.
 */
function encodeMath(math: any): HTMLElement {
  return h('math', { innerHTML: math.text })
}

/**
 * Decode a `<stencila-null>` element to a `null`.
 */
function decodeNull(elem: HTMLElement): null {
  return null
}

/**
 * Encode a `null` to a `<stencila-null>` element.
 */
function encodeNull(value: null): HTMLElement {
  return h('stencila-null', 'null')
}

/**
 * Decode a `<stencila-boolean>` element to a `boolean`.
 */
function decodeBoolean(elem: HTMLElement): boolean {
  return elem.innerHTML === 'true'
}

/**
 * Encode a `boolean` to a `<stencila-boolean>` element.
 */
function encodeBoolean(value: boolean): HTMLElement {
  return h('stencila-boolean', value === true ? 'true' : 'false')
}

/**
 * Decode a `<stencila-number>` element to a `number`.
 */
function decodeNumber(elem: HTMLElement): number {
  return parseFloat(elem.innerHTML || '0')
}

/**
 * Encode a `number` to a `<stencila-number>` element.
 */
function encodeNumber(value: number): HTMLElement {
  return h('stencila-number', value.toString())
}

/**
 * Decode a `<stencila-array>` element to a `array`.
 */
function decodeArray(elem: HTMLElement): any[] {
  return JSON5.parse(elem.innerHTML || '[]')
}

/**
 * Encode a `array` to a `<stencila-array>` element.
 */
function encodeArray(value: any[]): HTMLElement {
  return h('stencila-array', JSON5.stringify(value))
}

/**
 * Decode a `<stencila-object>` element to a `object`.
 */
function decodeObject(elem: HTMLElement): object {
  return JSON5.parse(elem.innerHTML || '{}')
}

/**
 * Encode a `object` to a `<stencila-object>` element.
 */
function encodeObject(value: object): HTMLElement {
  return h('stencila-object', JSON5.stringify(value))
}

/**
 * Decode a `<stencila-thing>` element to a `Thing`.
 */
function decodeThing(elem: HTMLElement): stencila.Thing {
  return JSON5.parse(elem.innerHTML || '{}')
}

/**
 * Encode a `Thing` to a `<stencila-thing>` element.
 */
function encodeThing(thing: stencila.Thing): HTMLElement {
  return h('stencila-thing', JSON5.stringify(thing))
}

/**
 * Decode a `#text` node to a `string`.
 */
function decodeText(text: Text): string {
  return text.data
}

/**
 * Encode a `string` to a `#text` node.
 */
function encodeString(value: string): Text {
  return document.createTextNode(escape(value))
}

/**
 * Decode the `data-` attributes of an element into a dictionary
 * of strings.
 */
function decodeDataAttrs(
  elem: HTMLElement
): { [key: string]: string } | undefined {
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
function encodeDataAttrs(meta: { [key: string]: string }): typeof meta {
  const attrs: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(meta)) {
    attrs['data-' + key] = value
  }
  return attrs
}

/**
 * Decode the `data-` attributes of an element into a dictionary
 * of strings.
 */
function decodeItemProps(
  elem: HTMLElement
): { [key: string]: string } | undefined {
  const dict: { [key: string]: string } = {}

  Array.from(elem.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .forEach(attr => (dict[attr.name.slice(5)] = attr.value))

  return Object.keys(dict).length ? dict : undefined
}
