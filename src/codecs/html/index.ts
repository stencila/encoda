/**
 * @module html
 */

import { getLogger } from '@stencila/logga'
import stencila, { cite } from '@stencila/schema'
import stencila, { Entity } from '@stencila/schema'
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
import { toFiles } from '../../util/toFiles'
import * as vfile from '../../util/vfile'
import { Codec, defaultEncodeOptions, GlobalEncodeOptions } from '../types'
import { logWarnLossIfAny } from '../../log'
import { VFileContents } from 'vfile'
import { stringifyContent } from '../../util/content/stringifyContent'

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

const encodeMaybe = <T>(
  maybe: T | undefined,
  html: (defined: T) => HTMLElement
): HTMLElement | undefined => {
  return maybe !== undefined && (Array.isArray(maybe) ? maybe.length > 0 : true)
    ? html(maybe)
    : undefined
}

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
   * Decode HTML content.
   *
   * Note that, if the HTML does not contain any handled elements, this will
   * return `undefined`.
   */
  public decodeHtml = (
    htmlContent: VFileContents
  ): stencila.Node | undefined => {
    const dom = new jsdom.JSDOM(htmlContent)
    const document = dom.window.document
    collapse(document)
    return decodeNode(document)
  }

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
    const node = this.decodeHtml(html)
    if (node === undefined) {
      log.warn(
        `No node could be decoded from HTML: ${
          html.length > 10 ? html.substr(0, 10) + '...' : html
        }`
      )
      return ''
    } else {
      return node
    }
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
      filePath,
      isStandalone = true,
      isBundle = false,
      theme = themes.stencila
    } = options

    // Reset the slugger to avoid unnecessarily adding numbers to ids
    // in order to make them unique
    slugger.reset()

    let nodeToEncode
    if (isBundle) nodeToEncode = await bundle(node)
    else {
      const docPath = filePath === undefined ? '.' : filePath
      const mediaPath = filePath === undefined ? './media' : `${filePath}.media`
      nodeToEncode = await toFiles(node, docPath, mediaPath, ['data', 'file'])
    }
    let dom: HTMLHtmlElement = encodeNode(nodeToEncode, {
      isStandalone,
      theme
    }) as HTMLHtmlElement

    if (isStandalone) {
      const nodeToEncode = isBundle ? await bundle(node) : node
      const { title, ...metadata } = getArticleMetaData(nodeToEncode)
      dom = generateHtmlElement(
        stringifyContent(title),
        metadata,
        [dom],
        options
      )
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

const decodeNodes = (nodes: Node[]): (stencila.Node | undefined)[] =>
  nodes.map(decodeNode)

const encodeNodes = (nodes: stencila.Node[]): Node[] => nodes.map(encodeNode)

function decodeNode(node: Node): stencila.Node | undefined {
  const type =
    node instanceof window.HTMLElement ? node.getAttribute('itemtype') : null

  const name =
    type !== null
      ? type
          .replace(/^https?:\/\/schema\.org\//, 'schema:')
          .replace(/^https?:\/\/schema\.stenci\.la\//, 'stencila:')
      : node.nodeName.toLowerCase()

  switch (name) {
    case '#document':
      return decodeDocument(node as HTMLDocument)

    case 'article':
    case 'schema:Article':
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
    case 'stencila:Datatable':
      return decodeDatatable(node as HTMLDivElement)
    case 'hr':
      return decodeHR()

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
    case 'stencila:CiteGroup':
      return decodeCiteGroup(node as HTMLOListElement)
    case 'code':
      return decodeCode(node as HTMLElement)
    case 'img':
      return decodeImage(node as HTMLImageElement)
    case 'figure':
      return decodeFigure(node as HTMLElement)
    case 'figcaption':
      return decodeFigCaption(node as HTMLElement)

    case 'stencila:Null':
      return decodeNull()
    case 'schema:Boolean':
      return decodeBoolean(node as HTMLElement)
    case 'schema:Number':
      return decodeNumber(node as HTMLElement)
    case 'stencila:Array':
      return decodeArray(node as HTMLElement)
    case 'stencila:Object':
      return decodeObject(node as HTMLElement)

    case 'script':
      return undefined

    case '#text':
      return decodeText(node as Text)
  }

  const match = name.match(/^h(\d)$/)
  if (match) {
    return decodeHeading(node as HTMLHeadingElement, parseInt(match[1], 10))
  }

  if (type !== null) return decodeEntity(node as HTMLElement)

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
      return encodeThematicBreak()

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
      return encodeNull()
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
      return encodeEntity(node as Entity)
  }
}

function decodeBlockChildNodes(node: Node): stencila.BlockContent[] {
  return Array.from(node.childNodes)
    .reduce(reduceNonNullable(decodeNode), [])
    .map(n => n as stencila.BlockContent)
}

function decodeInlineChildNodes(node: Node): stencila.InlineContent[] {
  return [...node.childNodes]
    .map(child => decodeNode(child) as stencila.InlineContent)
    .filter(n => n !== '')
}

/**
 * Decode a `#document` node to a `stencila.Node`.
 */
function decodeDocument(doc: HTMLDocument): stencila.Node | undefined {
  const head = doc.querySelector('head')
  if (!head) throw new Error('Document does not have a <head>!')

  const body = doc.querySelector('body')
  if (!body) throw new Error('Document does not have a <body>!')

  const jsonld = head.querySelector('script[type="application/ld+json"]')
  const metadata = jsonld ? JSON.parse(jsonld.innerHTML || '{}') : {}
  delete metadata['@context']

  if (!jsonld && body.childElementCount === 1) {
    return decodeNode(body.children[0])
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
  const children = [...div.childNodes]

  // If the div only contains a single element, return a Node, rather than a list of Nodes
  if (children.length === 1) {
    return decodeNode(children[0])
  } else {
    return children.map(decodeNode)
  }
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
  const prop = propSelector(element)

  let title = 'Untitled'
  const headline = prop('headline')
  if (headline !== undefined) {
    title = headline.textContent || 'Untitled'
    headline.remove()
  }

  const references = element.querySelectorAll<HTMLOListElement>(
    'ol.references > li'
  )

  const refItems = references ? [...references].map(decodeCreativeWork) : []

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
  const {
    type,
    title,
    authors,
    datePublished,
    description,
    content = [],
    references,
    ...lost
  } = article
  logWarnLossIfAny('html', 'encode', article, lost)

  return h(
    'article',
    { attrs: { itemtype: 'https://schema.org/Article', itemscope: true } },
    encodeTitle(title),
    encodeMaybe(authors, authors => encodeAuthors(authors)),
    encodeMaybe(datePublished, date => encodeDate(date, 'datePublished')),
    encodeMaybe(description, desc => encodeDescription(desc)),
    ...encodeNodes(content),
    encodeMaybe(references, refs => encodeReferences(refs))
  )
}

function encodeTitle(title: string | stencila.Node[]): HTMLElement {
  return h(
    'h1',
    { itemprop: 'headline' },
    encodeNodes(typeof title === 'string' ? [title] : title)
  )
}

function encodeAuthors(
  authors: (stencila.Person | stencila.Organization)[]
): HTMLElement {
  return h(
    'ol',
    { class: 'authors' },
    ...authors.map(author =>
      author.type === 'Person'
        ? encodePerson(author, 'li')
        : encodeOrganization(author, 'li')
    )
  )
}

function encodeDate(
  date: string | stencila.Date,
  property?: string
): HTMLElement {
  return h(
    'time',
    { ...(property ? { itemprop: property } : {}), datetime: date },
    date
  )
}

function encodeDescription(desc: string | stencila.Node[]): HTMLElement {
  return h(
    'section',
    h('h2', 'Abstract'),
    h(
      'div',
      { itemprop: 'description' },
      encodeNodes(typeof desc === 'string' ? [desc] : desc)
    )
  )
}

function encodeReferences(
  references: (string | stencila.CreativeWork)[]
): HTMLElement {
  return h(
    'section',
    h('h2', 'References'),
    h('ol', { class: 'references' }, references.map(encodeReference))
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

type CreativeWorkTagMap = {
  [key in stencila.CreativeWork['type']]: keyof HTMLElementTagNameMap
}

const creativeWorkTagMap: CreativeWorkTagMap = {
  Article: 'article',
  AudioObject: 'audio',
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
  const headline = workSelector('headline')
  const url = workSelector('url')

  return {
    type: 'CreativeWork',
    title: headline && headline.textContent ? headline.textContent : 'Untitled',
    authors: workSelectorAll('author').map(decodePerson),
    funders: workSelectorAll('funder').map(decodePerson),
    editors: workSelectorAll('editor').map(decodePerson),
    url: url ? url.getAttribute('href') || undefined : undefined,
    ...propsToValues(work)(['dateCreated', 'dateModified', 'datePublished'])
  }
}

function encodeCreativeWork(
  work: stencila.CreativeWork,
  { attrs, as }: CreativeWorkOptions = defaultCreativeWorkOptions
): HTMLElement {
  const { id, title, url, authors = [], datePublished, content = [] } = work
  return h(
    as || creativeWorkTagMap[work.type] || 'div',
    {
      attrs: {
        itemtype: 'https://schema.org/CreativeWork',
        itemscope: true,
        ...attrs
      },
      id
    },
    h(url ? 'a' : 'span', { itemprop: 'headline', href: url }, title),
    encodeAuthors(authors),
    encodeMaybe(datePublished, date => encodeDate(date, 'datePublished')),
    optionalHTML(url, h('a', { itemprop: 'url', href: url }, url)),
    encodeNodes(content)
  )
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
  const {
    givenNames = [],
    familyNames = [],
    url,
    emails = [],
    // affiliations,
    ...lost
  } = person
  logWarnLossIfAny('html', 'encode', person, lost)

  const name = [
    h('span', { itemprop: 'familyName' }, familyNames.join(' ')),
    h('span', { itemprop: 'givenName' }, givenNames.join(' '))
  ]

  return h(
    as || 'span',
    {
      attrs: {
        itemtype: 'https://schema.org/Person',
        itemscope: true,
        itemprop: 'author'
      }
    },
    url ? h('a', { href: url }, ...name) : name,
    ...emails.map(email => h('a', { href: `mailto:${email}`, itemprop: 'email'}, email))
  )
}

function encodeOrganization(
  org: stencila.Organization,
  as?: keyof HTMLElementTagNameMap
): HTMLElement {
  const { name, url, ...lost} = org
  logWarnLossIfAny('html', 'encode', org, lost)

  return h(
    as || 'div',
    url ? h('a', { href: url }, name) : name
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
  elem.setAttribute('itemtype', `https://schema.stenci.la/${nodeType(include)}`)
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

export const decodeHref = (href?: string | null): string => {
  if (!isDefined(href)) return '#'
  return href.startsWith('#') ? href.substring(1) : href
}

export const encodeHref = (href?: string | null): string => {
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

  return cite(decodeHref(target ? target.getAttribute('href') : '#'), {
    prefix: isDefined(prefix) ? prefix.textContent || undefined : undefined,
    suffix: isDefined(suffix) ? suffix.textContent || undefined : undefined
  })
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
 * Decode a `<ol itemtype="https://schema.stenci.la/CiteGroup">` element to a `stencila.CiteGroup`.
 */
function decodeCiteGroup(citeGroup: HTMLOListElement): stencila.CiteGroup {
  return {
    type: 'CiteGroup',
    items: [...citeGroup.querySelectorAll<HTMLElement>('cite')].map(decodeCite)
  }
}

/**
 * Encode a `stencila.CiteGroup` element to a `<ol itemtype="https://schema.stenci.la/CiteGroup">`.
 */
function encodeCiteGroup(citeGroup: stencila.CiteGroup): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.stenci.la/CiteGroup' } },
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
  const { id, label, caption = [], content = [] } = figure
  return h('figure', { id, title: label }, [
    ...encodeNodes(content),
    // TODO: determine best placement of figure label
    // optionalHTML(label, h('label', label)),
    optionalHTML(caption.length, h('figcaption', caption.map(encodeNode)))
  ])
}

/**
 * Decode a `<ol itemtype="https://schema.org/Collection">` element to a `stencila.Collection`.
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
 * Encode a `stencila.Collection` node to a `<ol itemtype="https://schema.org/Collection">` element.
 */
function encodeCollection(collection: stencila.Collection): HTMLOListElement {
  return h(
    'ol',
    { attrs: { itemtype: 'https://schema.org/Collection' } },
    collection.parts.map(entry => h('li', encodeNode(entry)))
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
 * Decode a `<div itemtype="https://schema.stenci.la/Datatable">` element to a Stencila `Datatable` node.
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
 * Encode a Stencila `Datatable` node to a `<div itemtype="https://schema.stenci.la/Datatable">` element.
 *
 * Note: currently this function is lossy for `DatatableColumn` properties
 * other than `name` and `value` (e.g. `schema`). These could be encoded into
 * the `<thead>`.
 */
function encodeDatatable(datatable: stencila.Datatable): HTMLElement {
  const cols = datatable.columns
  const rows = (cols[0] && cols[0].values.map((_, row) => row)) || []

  // prettier-ignore
  return h('div',
    { attrs: {itemtype: 'https://schema.stenci.la/Datatable'}},
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
function decodeHR(): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Encode a `stencila.ThematicBreak` to a `<hr>` element.
 */
function encodeThematicBreak(): HTMLHRElement {
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
    contentUrl: elem.getAttribute('src') || ''
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
 * Decode a `<span itemtype="https://schema.stenci.la/Null>` element to a `null`.
 */
function decodeNull(): null {
  return null
}

/**
 * Encode a `null` to a `<span itemtype="https://schema.stenci.la/Null>` element.
 */
function encodeNull(): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.stenci.la/Null' } },
    'null'
  )
}

/**
 * Decode a `<span itemtype="https://schema.org/Boolean>` element to a `boolean`.
 */
function decodeBoolean(elem: HTMLElement): boolean {
  return elem.innerHTML === 'true'
}

/**
 * Encode a `boolean` to a `<span itemtype="https://schema.org/Boolean>` element.
 */
function encodeBoolean(value: boolean): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.org/Boolean' } },
    value === true ? 'true' : 'false'
  )
}

/**
 * Decode a `<span itemtype="https://schema.org/Number>` element to a `number`.
 */
function decodeNumber(elem: HTMLElement): number {
  return parseFloat(elem.innerHTML || '0')
}

/**
 * Encode a `number` to a `<span itemtype="https://schema.org/Number>` element.
 */
function encodeNumber(value: number): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.org/Number' } },
    value.toString()
  )
}

/**
 * Decode a `<span itemtype="https://schema.stenci.la/Array>` element to a `array`.
 */
function decodeArray(elem: HTMLElement): any[] {
  return JSON5.parse(elem.innerHTML || '[]')
}

/**
 * Encode a `array` to a `<span itemtype="https://schema.stenci.la/Array>` element.
 */
function encodeArray(value: any[]): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.stenci.la/Array' } },
    JSON5.stringify(value)
  )
}

/**
 * Decode a `<span itemtype="https://schema.stenci.la/Object>` element to a `object`.
 */
function decodeObject(elem: HTMLElement): object {
  return JSON5.parse(elem.innerHTML || '{}')
}

/**
 * Encode a `object` to a `<span itemtype="https://schema.stenci.la/Object>` element.
 */
function encodeObject(value: object): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.stenci.la/Object' } },
    JSON5.stringify(value)
  )
}

/**
 * Decode a `<span itemtype="...">` element to a `Entity`.
 */
function decodeEntity(elem: HTMLElement): stencila.Entity {
  const json = elem.textContent || '{}'
  try {
    return JSON5.parse(json)
  } catch (error) {
    const { stack } = error
    log.error({
      message: `Error parsing JSON: ${json}`,
      stack
    })
    return stencila.entity()
  }
}

/**
 * Encode a node type not handled explicitly by one of the
 * other `encode*` function to a `<span itemtype="https://schema.stenci.la/Entity">` element.
 * We use `itemtype` `Entity` because usually you want to hide these
 * nodes in HTML and the `type` is stored in the JSON anyway.
 */
function encodeEntity(entity: stencila.Entity): HTMLElement {
  return h(
    'span',
    { attrs: { itemtype: 'https://schema.stenci.la/Entity' } },
    JSON5.stringify(entity)
  )
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
