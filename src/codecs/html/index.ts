/**
 * [[include:src/codecs/html/README.md]]
 *
 * @module codecs/html
 */

import { getLogger } from '@stencila/logga'
import stencila, {
  isA,
  isInlineContent,
  microdata,
  microdataItemtype,
  microdataProperty,
  microdataRoot,
  microdataType,
  nodeType,
  thematicBreak,
} from '@stencila/schema'
import collapse from 'collapse-whitespace'
import escape from 'escape-html'
import { dropLeft, flatten, isNonEmpty, takeLeftWhile } from 'fp-ts/lib/Array'
import GithubSlugger from 'github-slugger'
import h from 'hyperscript'
import { html as beautifyHtml } from 'js-beautify'
import jsdom from 'jsdom'
import JSON5 from 'json5'
// @ts-ignore
import MathJax from 'mathjax-node'
import { VFileContents } from 'vfile'
import { columnIndexToName } from '../../codecs/xlsx'
import { logWarnLossIfAny } from '../../util/logging'
import { isDefined } from '../../util'
import { ensureBlockContentArrayOrUndefined } from '../../util/content/ensureBlockContentArray'
import { getThemeAssets } from '../../util/html'
import { fromFiles } from '../../util/media/fromFiles'
import {
  encodeCiteAuthors,
  encodeCiteNumeric,
  encodeCiteYear,
} from '../../util/references'
import { truncate } from '../../util/truncate'
import * as vfile from '../../util/vfile'
import { plotlyMediaType } from '../plotly'
import { TxtCodec } from '../txt'
import { Codec, CommonEncodeOptions } from '../types'
import { isVegaMediaType, vegaMediaType } from '../vega'

export const stencilaItemType = 'data-itemtype'
export const stencilaItemProp = 'data-itemprop'

const window = new jsdom.JSDOM().window
const document = window.document

const log = getLogger('encoda:html')

// The maximum length for a Article headline
const headlineMaxLength = 110

// Ensures unique `id` attributes (e.g. for headings)
const slugger = new GithubSlugger()

/**
 * MathJax typesetting promises.
 *
 * A global list of promises that need to be awaited when encoding a
 * node. See `mathJaxTypeset`. This is a bit hackish but allows the use
 * of async MathJax rendering within a deeply nested `encode*` function,
 * with out having to make all the `encode*` functions async.
 */
let mathJaxPromises: Promise<unknown>[] = []

/**
 * Reset the set of MathJax promises to be awaited.
 */
function mathJaxInit(): void {
  mathJaxPromises = []
}

/**
 * Render math as HTML using MathJax and set the `innerHTML` of the
 * `elem`.
 */
function mathJaxTypeset(elem: HTMLElement, options: unknown): void {
  mathJaxPromises.push(
    MathJax.typeset(options)
      .then((result: any) => {
        elem.innerHTML = result.html
      })
      .catch((error: Error) => log.error(error))
  )
}

/**
 * Wait for all MathJax typesetting promises.
 */
async function mathJaxFinish(): Promise<unknown> {
  return Promise.all(mathJaxPromises)
}

/**
 * Generate placeholder using given dimensions and text.
 */
const placeholderImg = (text: string, width: number, height = width): string =>
  `https://via.placeholder.com/${width}x${height}/dbdbdb/4a4a4a.png?text=${encodeURI(
    truncate(text, headlineMaxLength)
  )}`

/**
 * Given a possibly undefined value, or empty array, return the HTML provided as the second argument
 * otherwise returns undefined.
 *
 * @param {unknown} value - Any possibly falsy value, most often an optional Stencila Schema node property
 * @param {HTMLElement} html - `HTMLElement` (usually a direct call to `hyperscript`) or function that produces it
 */
const encodeMaybe = <T>(
  value: T | undefined,
  html: HTMLElement | ((defined: T) => HTMLElement | HTMLElement[])
): HTMLElement | HTMLElement[] | undefined => {
  return value !== undefined && (Array.isArray(value) ? value.length > 0 : true)
    ? typeof html === 'function'
      ? html(value)
      : html
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
  return match ?? undefined
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
  return match.length > 0 ? [...match] : []
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
  return match?.textContent ?? undefined
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
      const value = match?.textContent
      return typeof value === 'string'
        ? { ...foundProps, [prop]: value }
        : foundProps
    },
    {}
  )
}

/**
 * It is necessary to maintain some state during encoding.
 * This interface defines that state and an instance
 * is passed down through the encoding functions.
 */
interface EncodeState {
  /**
   * The references of the `CreativeWork` currently being encoded (if any).
   * Used to populate the `content` property of `Cite` nodes.
   */
  references?: stencila.CreativeWork['references']
}

export class HTMLCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/html']

  /**
   * Decode HTML content.
   *
   * Note that, if the HTML does not contain any handled elements, this will
   * return `undefined`.
   */
  public decodeHtml = (htmlContent: VFileContents): stencila.Node => {
    const dom = new jsdom.JSDOM(htmlContent)
    const document = dom.window.document
    collapse(document)
    const node = decodeNode(document)
    if (Array.isArray(node)) {
      if (node.length === 0) {
        const htmlContentTrimmed = htmlContent.toString().trim()
        log.warn(
          `No node could be decoded from HTML: ${
            htmlContentTrimmed.length > 10
              ? htmlContentTrimmed.substr(0, 10) + '...'
              : htmlContentTrimmed
          }`
        )
        return ''
      } else if (node.length === 1) {
        return node[0]
      }
    }
    return node
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
    return this.decodeHtml(html)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with HTML contents.
   *
   * The attribute `data-itemscope="root"` is added to the root node
   * of the encoded HTML. This attribute can be used to scope CSS variables
   * to within the top-level Stencila Node.
   *
   * @param node The `Node` to encode.
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const { isStandalone, isBundle, theme } = {
      ...this.commonEncodeDefaults,
      ...options,
    }

    // Reset the slugger to avoid unnecessarily adding numbers to ids
    // in order to make them unique
    slugger.reset()

    if (isBundle) node = await fromFiles(node)

    mathJaxInit()

    const state: EncodeState = {}
    const fragment = Array.isArray(node)
    let dom = Array.isArray(node)
      ? h('div', encodeNodes(node, state))
      : (encodeNode(node, state) as HTMLElement)

    const [name, value] = Object.entries(microdataRoot())[0]
    dom.setAttribute(name, value as string)

    await mathJaxFinish()

    if (isStandalone) {
      const { title = 'Untitled' } = getArticleMetaData(node)
      dom = await generateHtmlElement(
        TxtCodec.stringify(title),
        [dom],
        isBundle,
        theme
      )
    }

    const html = fragment ? dom.innerHTML : dom.outerHTML
    const beautifulHtml = beautify(html)
    return vfile.load(beautifulHtml)
  }
}

export const beautify = (html: string): string =>
  /* eslint-disable camelcase */
  beautifyHtml(html, {
    indent_size: 2,
    indent_inner_html: true, // Indent <head> and <body> sections
    wrap_line_length: 100,
    preserve_newlines: false, // Preserve existing line-breaks
    // "List of tags (defaults to inline) that should not be reformatted"
    inline: [
      // List from list is from https://github.com/beautify-web/js-beautify/blob/97caa308491e1379b226c514f677fa4f278e15d4/js/src/html/options.js#L53
      'a',
      'abbr',
      'acronym',
      'area',
      'audio',
      'b',
      'bdi',
      'bdo',
      'big',
      'br',
      'button',
      'canvas',
      'cite',
      'code',
      'data',
      'datalist',
      'del',
      'dfn',
      'em',
      'embed',
      'i',
      'iframe',
      'img',
      'input',
      'ins',
      'kbd',
      'keygen',
      'label',
      'map',
      'mark',
      'math',
      'meter',
      'noscript',
      'object',
      'output',
      'progress',
      'q',
      'ruby',
      's',
      'samp',
      'select',
      'small',
      'span',
      'strike',
      'strong',
      'sub',
      'sup',
      'svg',
      'template',
      'text',
      'textarea',
      'time',
      'tt',
      'u',
      'var',
      'video',
      'wbr',
      // Additions
      'address', // See https://github.com/stencila/encoda/issues/764
    ],
  })
/* eslint-enable camelcase */

const getArticleMetaData = (
  node: stencila.Node
): Exclude<stencila.Article, 'content'> => {
  const article = stencila.isA('Article', node) ? node : stencila.article()
  const { content, ...metadata } = article
  return metadata
}

const decodeNodes = (nodes: Node[]): stencila.Node[] =>
  nodes
    .map(decodeNode)
    .reduce(
      (prev: Node[], curr) => [
        ...prev,
        ...(Array.isArray(curr) ? curr : [curr]),
      ],
      []
    )

const decodeChildNodes = (node: Node): stencila.Node[] =>
  decodeNodes([...node.childNodes])

const decodeBlockChildNodes = (node: Node): stencila.BlockContent[] =>
  decodeChildNodes(node).map((n) => n as stencila.BlockContent)

const decodeInlineChildNodes = (node: Node): stencila.InlineContent[] =>
  decodeChildNodes(node)
    .map((n) => n as stencila.InlineContent)
    .filter((n) => n !== '')

function decodeNode(node: Node): stencila.Node | stencila.Node[] {
  // TODO: Avoid the following use of `@ts-ignore` and `as`
  // With major version upgrade to jsdom (and others 7b8399a791b5b8c9e6cd7e146b143c0ebd1c9257)
  // the `test node instanceof window.HTMLElement` was always falsy and
  // the `typeof node.getAttribute === 'function'` is intended as a temporary workaround
  const itemtype =
    node instanceof window.HTMLElement ||
    // @ts-ignore
    typeof node.getAttribute === 'function'
      ? (node as HTMLElement).getAttribute('itemtype')
      : null
  const type = itemtype !== null ? microdataType(itemtype) : undefined
  const tag = node.nodeName.toLowerCase()
  const name = type ?? tag
  switch (name) {
    case '#document':
      return decodeDocument(node as HTMLDocument)

    case 'article':
    case 'Article':
      return decodeArticle(node as HTMLElement)

    case 'p':
    case 'Paragraph':
      return decodeParagraph(node as HTMLParagraphElement)

    case 'blockquote':
    case 'QuoteBlock':
      return decodeBlockquote(node as HTMLQuoteElement)

    case 'pre':
      if (node.firstChild?.nodeName === 'CODE') {
        return decodeCodeBlock(node as HTMLPreElement)
      }
      break
    case 'CodeBlock':
      return decodeCodeBlock(node as HTMLPreElement)

    case 'stencila-code-chunk':
    case 'CodeChunk':
      return decodeCodeChunk(node as HTMLElement)

    case 'ul':
    case 'ol':
    case 'List':
      return decodeList(node as HTMLUListElement)
    case 'Collection':
      return decodeCollection(node as HTMLOListElement)

    case 'li':
    case 'ListItem':
      return decodeListItem(node as HTMLLIElement)

    case 'table':
    case 'Table':
      return decodeTable(node as HTMLTableElement)

    case 'tr':
    case 'TableRow':
      return decodeTableRow(node as HTMLTableRowElement)

    case 'th':
    case 'td':
    case 'TableCell':
      return decodeTableCell(node as HTMLTableCellElement)

    case 'Datatable':
      return decodeDatatable(node as HTMLDivElement)

    case 'hr':
    case 'ThematicBreak':
      return decodeHR()

    case 'em':
    case 'Emphasis':
    case 'Mark':
      return decodeMark(node as HTMLElement, 'Emphasis')
    case 'strong':
    case 'Strong':
      return decodeMark(node as HTMLElement, 'Strong')
    case 'del':
    case 'Delete':
      return decodeMark(node as HTMLElement, 'Delete')
    case 'sup':
    case 'Superscript':
      return decodeMark(node as HTMLElement, 'Superscript')
    case 'sub':
    case 'Subscript':
      return decodeMark(node as HTMLElement, 'Subscript')

    case 'a':
    case 'Link':
      return decodeLink(node as HTMLAnchorElement)

    case 'q':
    case 'Quote':
      return decodeQuote(node as HTMLQuoteElement)

    case 'cite':
    case 'Cite':
      return decodeCite(node as HTMLElement)

    case 'CiteGroup':
      return decodeCiteGroup(node as HTMLOListElement)

    case 'stencila-code-expression':
    case 'CodeExpression':
      return decodeCodeExpression(node as HTMLElement)

    case 'code':
    case 'CodeFragment':
      return decodeCodeFragment(node as HTMLElement)

    case 'img':
    case 'ImageObject':
      return decodeImage(node as HTMLImageElement)

    case 'figure':
    case 'Figure':
      return decodeFigure(node as HTMLElement)

    case 'figcaption':
      return decodeFigCaption(node as HTMLElement)
    case 'math':
      return decodeMath(node as HTMLElement)

    case 'Person':
      return decodePerson(node as HTMLElement)

    case 'Null':
      return decodeNull()
    case 'Boolean':
      return decodeBoolean(node as HTMLElement)
    case 'Number':
      return decodeNumber(node as HTMLElement)
    case 'Array':
      return decodeArray(node as HTMLElement)
    case 'Object':
      return decodeObject(node as HTMLElement)

    // Container elements which are 'unwrapped'
    // by simply decoding their children
    case 'div':
    case 'span':
    case 'time':
      return decodeChildNodes(node)

    // Elements that are converted into text
    case 'br':
      return ['\n']

    // Elements that are explicitly ignored
    // i.e. no warning
    case 'script':
      return []

    // Text content of elements
    case '#text':
      return decodeText(node as Text)
  }

  const match = (s: string): RegExpExecArray | null => /^h(\d)$/i.exec(s)
  if (match(name) !== null || name === 'Heading') {
    const tag = match(node.nodeName)
    const level = tag !== null ? tag[1] : '1'
    const depth = parseInt(level, 10)
    return decodeHeading(node as HTMLHeadingElement, depth)
  }

  if (itemtype !== null) return decodeEntity(node as HTMLElement)

  log.warn(`No handler for HTML element <${name}>`)
  return []
}

function encodeNode(node: stencila.Node, state: EncodeState): Node {
  switch (nodeType(node)) {
    case 'Article':
      return encodeArticle(node as stencila.Article, state)

    case 'Include':
      return encodeInclude(node as stencila.Include, state)

    case 'Heading':
      return encodeHeading(node as stencila.Heading, state)
    case 'Paragraph':
      return encodeParagraph(node as stencila.Paragraph, state)
    case 'QuoteBlock':
      return encodeQuoteBlock(node as stencila.QuoteBlock, state)
    case 'Cite':
      return encodeCite(node as stencila.Cite, state)
    case 'CiteGroup':
      return encodeCiteGroup(node as stencila.CiteGroup, state)
    case 'CodeBlock':
      return encodeCodeBlock(node as stencila.CodeBlock)
    case 'CodeChunk':
      return encodeCodeChunk(node as stencila.CodeChunk, state)
    case 'CodeExpression':
      return encodeCodeExpression(node as stencila.CodeExpression, state)
    case 'CodeFragment':
      return encodeCodeFragment(node as stencila.CodeFragment)
    case 'Person':
      return encodePerson(node as stencila.Person)
    case 'CreativeWork':
    case 'Periodical':
    case 'PublicationIssue':
    case 'PublicationVolume':
    case 'SoftwareSourceCode':
    case 'MediaObject':
      return encodeCreativeWork(node as stencila.CreativeWork, state)
    case 'Collection':
      return encodeCollection(node as stencila.Collection, state)
    case 'Figure':
      return encodeFigure(node as stencila.Figure, state)
    case 'List':
      return encodeList(node as stencila.List, state)
    case 'ListItem':
      return encodeListItem(node as stencila.ListItem, state)
    case 'Table':
      return encodeTable(node as stencila.Table, state)
    case 'TableRow':
      return encodeTableRow(node as stencila.TableRow, state)
    case 'TableCell':
      return encodeTableCell(node as stencila.TableCell, state)
    case 'Datatable':
      return encodeDatatable(node as stencila.Datatable)
    case 'Date':
      return encodeDate(node as stencila.Date)
    case 'ThematicBreak':
      return encodeThematicBreak()
    case 'Organization':
      return encodeOrganization(node as stencila.Organization)

    case 'Mark':
    case 'Emphasis':
      return encodeMark(node as stencila.Emphasis, state, 'em')
    case 'Strong':
      return encodeMark(node as stencila.Strong, state, 'strong')
    case 'Delete':
      return encodeMark(node as stencila.Strong, state, 'del')
    case 'Superscript':
      return encodeMark(node as stencila.Superscript, state, 'sup')
    case 'Subscript':
      return encodeMark(node as stencila.Subscript, state, 'sub')
    case 'Link':
      return encodeLink(node as stencila.Link, state)
    case 'Quote':
      return encodeQuote(node as stencila.Quote)

    case 'MathBlock':
    case 'MathFragment':
      return encodeMath(node as stencila.Math)

    case 'AudioObject':
      return encodeAudioObject(node as stencila.AudioObject)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
    case 'VideoObject':
      return encodeVideoObject(node as stencila.VideoObject)

    case 'Null':
      return encodeNull()
    case 'Boolean':
      return encodeBoolean(node as boolean)
    case 'Number':
      return encodeNumber(node as number)
    case 'String':
      return encodeString(node as string)
    case 'Array':
      return encodeArray(node as unknown[])
    case 'Object':
      return encodeObject(node as object)
    default:
      return encodeEntity(node as stencila.Entity)
  }
}

/**
 * Encode an array of Stencila `Node`s.
 */
function encodeNodes(nodes: stencila.Node[], state: EncodeState): Node[] {
  return nodes.map((node) => encodeNode(node, state))
}

/**
 * Decode a `#document` node to a `stencila.Node`.
 */
function decodeDocument(doc: HTMLDocument): stencila.Node {
  const body = doc.querySelector('body')
  if (body === null) throw new Error('Document does not have a <body>!')
  const children = [...body.childNodes]
  return children.length === 0 ? [] : decodeNodes([...body.childNodes])
}

/**
 * Generate a `<html>` element with supplied title, metadata, body content, and
 * optionally custom CSS to style the document with.
 *
 * Conforms to https://dequeuniversity.com/rules/axe/3.5/landmark-one-main?
 * by placing the root element in a `<main role="main">`.
 *
 * TODO: This function needs refactoring. It only called from one location
 * and it may be better to move some of all of it there.
 */
async function generateHtmlElement(
  title: string,
  root: Node[],
  isBundle: boolean,
  theme?: string
): Promise<HTMLHtmlElement> {
  let themeCss: HTMLElement[] = []
  let themeJs: HTMLElement[] = []
  if (theme !== undefined) {
    const { styles, scripts } = await getThemeAssets(theme, isBundle)
    if (isBundle) {
      // Bundle the theme into the document
      themeCss = styles.map((style) =>
        h('style', {
          innerHTML: style,
        })
      )

      themeJs = scripts.map((src) =>
        h('script', {
          innerHTML: src,
        })
      )
    } else {
      themeCss = styles.map((style) =>
        h('link', {
          href: style,
          rel: 'stylesheet',
        })
      )

      themeJs = scripts.map((src) =>
        h('script', {
          src: src,
          type: 'text/javascript',
        })
      )
    }
  }

  return h(
    'html',
    { lang: 'en' },
    h(
      'head',
      h('title', title),
      h('meta', { charset: 'utf-8' }),
      h('meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      }),
      h('meta', { 'http-equiv': 'X-UA-Compatible', content: 'ie=edge' }),
      ...themeCss,
      ...themeJs,
      h('script', {
        src:
          'https://unpkg.com/@stencila/components@<=1/dist/stencila-components/stencila-components.esm.js',
        type: 'module',
      }),
      h('script', {
        attrs: {
          nomodule: '',
        },
        src:
          'https://unpkg.com/@stencila/components@<=1/dist/stencila-components/stencila-components.js',
        type: 'text/javascript',
      })
    ),
    h('body', h('main', { attrs: { role: 'main' } }, root))
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
    title = headline.textContent ?? 'Untitled'
    headline.remove()
  }

  const references = element.querySelectorAll<HTMLOListElement>(
    'ol[data-itemprop="references"] > li'
  )

  const refItems =
    references.length > 0 ? [...references].map(decodeCreativeWork) : []

  return stencila.article({
    title,
    references: isNonEmpty(refItems) ? refItems : undefined,
    content: ensureBlockContentArrayOrUndefined(decodeChildNodes(element)),
  })
}

/**
 * Encode an `Article` node to a `<article>` element.
 */
function encodeArticle(
  article: stencila.Article,
  state: EncodeState
): HTMLElement {
  const {
    type,
    title,
    authors,
    publisher,
    datePublished,
    genre,
    about,
    keywords,
    identifiers,
    description,
    content = [],
    references,
    ...lost
  } = article
  logWarnLossIfAny('html', 'encode', article, lost)

  // Add this article's references to the state for used by other
  // decoding functions
  state = { ...state, references }

  return h(
    'article',
    encodeAttrs(article),
    encodeTitleProperty(title, state),
    encodeImageProperty(article),
    encodeMaybe(authors, (authors) => encodeAuthorsProperty(authors)),
    encodePublisherProperty(publisher),
    encodeMaybe(datePublished, (date) => encodeDate(date, 'datePublished')),
    encodeClassificatoryProperties({ genre, about, keywords }),
    encodeIdentifiersProperty(identifiers),
    encodeMaybe(description, (desc) => encodeDescriptionProperty(desc, state)),
    encodeNodes(content, state),
    encodeMaybe(references, (refs) => encodeReferencesProperty(refs, state))
  )
}

/**
 * Encode the `Article.publisher` property to HTML.
 *
 * The GSDTT requires an `Article` to have a `publisher` property
 * with a `name` and `logo.url`.
 *
 * If a publisher logo is found, insert as an image,
 * otherwise as an invisible `meta` tag with a placeholder image.
 */
function encodePublisherProperty(
  publisher: stencila.Article['publisher']
): HTMLElement {
  publisher = publisher ?? stencila.organization()

  const { name = 'Unknown' } = publisher
  const nameTag = isDefined(publisher.name) ? 'span' : 'meta'

  let logo = stencila.isA('Organization', publisher)
    ? publisher.logo
    : undefined

  let logoTag = 'img'
  if (logo === undefined) {
    logoTag = 'meta'
    logo = stencila.imageObject({
      contentUrl: placeholderImg(name, 600, 60),
    })
  } else if (typeof logo === 'string')
    logo = stencila.imageObject({ contentUrl: logo })

  return h(
    'span',
    encodeAttrs(publisher, { itemprop: 'publisher' }),
    h(nameTag, { itemprop: 'name', content: name }, name),
    h(
      'span',
      encodeAttrs(logo, { itemprop: 'logo' }),
      // Both `content` and `src` are necessary here if `logoTag`
      // is `img`
      h(logoTag, {
        attrs: {
          itemprop: 'url',
          content: logo.contentUrl,
          ...(logoTag === 'img' ? { src: logo.contentUrl } : {}),
        },
      })
    )
  )
}

/**
 * Encode the `Article.title` property to HTML.
 *
 * The GSDTT requires that the `Article.headline` property be a string
 * less than 110 characters so, if it isn't (to long, or structured content),
 * stringify and/or truncate it and use the* `content` attribute.
 */
function encodeTitleProperty(
  title: stencila.Article['title'],
  state: EncodeState,
  tag: 'h1' | 'span' = 'h1'
): HTMLElement | undefined {
  if (title === undefined) return undefined

  const content = truncate(TxtCodec.stringify(title), headlineMaxLength)
  return h(
    tag,
    {
      attrs: {
        ...microdata(title, 'title'),
        ...(content !== title ? { content } : {}),
      },
    },
    typeof title === 'string' ? title : encodeNodes(title, state)
  )
}

/**
 * Encode the `Article.image` property to HTML.
 *
 * The GSDTT requires an `Article` to have a `image` property.
 * This currently uses a placeholder but should walk through the `content`
 * tree and find the first image.
 */
function encodeImageProperty(article: stencila.Article): HTMLElement {
  // TODO: Implement tree walking search for an image
  const headline = typeof article.title === 'string' ? article.title : ''
  const fallback = placeholderImg(headline, 1200, 714)
  return h('meta', { itemprop: 'image', content: fallback })
}

/**
 * Encode authors and their organizational affiliations.
 *
 * This function takes the usual approach of representing
 * authors and their affiliations as two separate lists with links
 * between them.
 */
function encodeAuthorsProperty(
  authors: (stencila.Person | stencila.Organization)[]
): HTMLElement[] {
  const init: { [key: string]: [number, stencila.Organization] } = {}
  const orgs = authors
    .map((author) =>
      stencila.isA('Person', author) && author.affiliations !== undefined
        ? author.affiliations
        : []
    )
    .reduce((prev, curr) => [...prev, ...curr], [])
    .reduce((prev, curr) => {
      const { name, meta } = curr
      if (name !== undefined && prev[name] === undefined) {
        const index = Object.keys(prev).length + 1
        prev[name] = [
          index,
          {
            ...curr,
            meta: {
              ...meta,
              /**
               * The [`itemid`](https://www.w3.org/TR/microdata/#dfn-itemid) attribute
               * must be a valid URL. So we prefix the node's `id` with a hash. Changing
               * this will break links between entities. See https://moz.com/blog/search-marketers-guide-to-itemref-itemid
               * for more.
               */
              itemid: `#author-organization-${index}`,
            },
          },
        ]
      }
      return prev
    }, init)

  return [
    h(
      'ol',
      microdata(orgs, 'authors', 'array'),
      ...authors.map((author) =>
        author.type === 'Person'
          ? encodePerson(author, 'authors', orgs, 'li')
          : encodeOrganization(author, 'authors', 'li')
      )
    ),
    ...(Object.keys(orgs).length > 0
      ? [
          h(
            'ol',
            microdata(orgs, 'affiliations', 'array'),
            Object.values(orgs).map(([_, org]) =>
              // Do not give a property since these are linked.
              encodeOrganization(org, undefined, 'li')
            )
          ),
        ]
      : []),
  ]
}

/**
 * Encode the `CreativeWork.isPartOf` property to HTML.
 *
 * This function is intended primarily for encoding the `isPartOf`
 * property of works that are themselves in the `references`
 * property of another work.
 *
 * It encodes the property "recursively upwards"
 * so that the ancestor `Periodical`, `PublicationVolume` and
 * `PublicationIssue` and `pageStart` etc nodes appear in that
 * order. e.g. `Peptides, 32(6), 1335-1355`
 */
function encodeIsPartOfProperty(
  work: stencila.CreativeWork['isPartOf'],
  tag: keyof HTMLElementTagNameMap = 'span'
): HTMLElement | undefined {
  if (work === undefined) return undefined

  const md = { attrs: microdata(work, 'isPartOf') }
  if (stencila.isA('PublicationIssue', work)) {
    const { issueNumber, isPartOf } = work
    return h(
      tag,
      md,
      encodeMaybe(issueNumber, (issueNumber) =>
        h('span', microdata(issueNumber, 'issueNumber'), issueNumber)
      ),
      encodeIsPartOfProperty(isPartOf)
    )
  } else if (stencila.isA('PublicationVolume', work)) {
    const { volumeNumber, isPartOf } = work
    return h(
      tag,
      md,
      encodeMaybe(volumeNumber, (volumeNumber) =>
        h('span', microdata(volumeNumber, 'volumeNumber'), volumeNumber)
      ),
      encodeIsPartOfProperty(isPartOf)
    )
  } else if (stencila.isA('Periodical', work)) {
    const { name } = work
    return h(
      tag,
      md,
      encodeMaybe(name, (name) => h('span', microdata(name, 'name'), name))
    )
  }
}

/**
 * Encode the pagination related properties of an article
 */
function encodePaginationProperties(
  article: stencila.Article
): (HTMLElement | undefined)[] {
  const { pageStart, pageEnd, pagination } = article
  if (pagination !== undefined)
    return [h('span', microdata(pagination, 'pagination'), pagination)]
  return [
    pageStart !== undefined
      ? h('span', microdata(pageStart, 'pageStart'), pageStart)
      : undefined,
    pageEnd !== undefined
      ? h('span', microdata(pageEnd, 'pageEnd'), pageEnd)
      : undefined,
  ]
}

/**
 * Encode classificatory properties( e.g. `about`, `genre` and `keyword`)
 * of a `CreativeWork`.
 *
 * This function encodes properties of a creative work that are of a classificatory nature.
 * There is no reason these need to be encoded in the the same function other than that
 * they share this general purpose.
 *
 * Although this function places the resulting HTML elements next to each other,
 * journals often display them in different places on the page and there is little consistency
 * in this. For example, `genre` is displayed above the `title` by PLOS and F1000 but below the
 * `title` by eLife, and `about` (aka subject areas) is displayed above the `title` by eLife
 * but in the right sidebar by PLOS and F1000. These diversity of presentations should be able
 * to be accommodated by Thema (e.g. by using CSS `order`).
 *
 * This function uses `Pick` rather accepting an entire `CreativeWork` so that the calling
 * function can warn of data loss (ie. properties that are not encoded).
 */
function encodeClassificatoryProperties(
  properties: Pick<stencila.CreativeWork, 'genre' | 'about' | 'keywords'>
): HTMLElement[] {
  const { genre, about, keywords } = properties

  return [
    ...(genre
      ? [
          h(
            'ul',
            { attrs: microdata(genre, 'genre', 'array') },
            genre.map((genreItem) =>
              h(
                'li',
                { attrs: microdata(genreItem, 'genre', 'item') },
                genreItem
              )
            )
          ),
        ]
      : []),
    ...(about
      ? [
          h(
            'ul',
            { attrs: microdata(about, 'about', 'array') },
            about.map((aboutItem) => {
              // An about item can be any `Thing` but will usually be a `DefinedTerm` (which is
              // also a thing). In any case we display it's `name` property encoded with the correct
              // Microdata.
              const { name } = aboutItem as stencila.Thing
              return name !== undefined && name.trim() !== ''
                ? h(
                    'li',
                    { attrs: microdata(aboutItem, 'about', 'item') },
                    h('span', { attrs: microdata(name, 'name') }, name)
                  )
                : undefined
            })
          ),
        ]
      : []),
    ...(keywords
      ? [
          h(
            'ul',
            { attrs: microdata(keywords, 'keywords', 'array') },
            keywords.map((keywordsItem) =>
              h(
                'li',
                { attrs: microdata(keywordsItem, 'keywords', 'item') },
                keywordsItem
              )
            )
          ),
        ]
      : []),
  ]
}

/**
 * Encode the `identifiers` property of a `Thing` node
 * as a HTML `<ul>` element.
 */
function encodeIdentifiersProperty(
  identifiers: stencila.Thing['identifiers']
): HTMLElement | undefined {
  if (identifiers === undefined) return undefined

  return h(
    'ul',
    microdata(identifiers, 'identifiers', 'array'),
    identifiers.map((identifier) => {
      const md = microdata(identifier, 'identifiers', 'item')

      if (typeof identifier === 'string')
        return h('li', { attrs: md }, identifier)

      const { name, propertyID, value, ...lost } = identifier
      logWarnLossIfAny('html', 'encode', identifier, lost)

      return h(
        'li',
        { attrs: md },
        encodeMaybe(propertyID, (propertyID) =>
          h('meta', {
            ...microdata(propertyID, 'propertyID'),
            content: propertyID,
          })
        ),
        encodeMaybe(name, (name) => h('span', microdata(name, 'name'), name)),
        encodeMaybe(value, (value) =>
          h('span', microdata(value, 'value'), value)
        )
      )
    })
  )
}

/**
 * Encode a `Date` node as a HTML `<time>` element.
 *
 * Note that since a `Date` is an [atomic data type](https://schema.org/DataType)
 * it is not given a Microdata `itemtype` attribute.
 *
 * @param date The date to encode
 * @param property The property the data belongs to
 * @param format The format for the content of the element.
 *               Only %Y supported at present.
 */
function encodeDate(
  date: string | stencila.Date,
  property?: string,
  format?: string
): HTMLElement {
  const value = stencila.isA('Date', date) ? date.value : date
  const content = format === '%Y' ? value.slice(0, 4) : value
  return h('time', { ...microdata(value, property), datetime: value }, content)
}

function encodeDescriptionProperty(
  desc: string | stencila.Node[],
  state: EncodeState
): HTMLElement {
  const descArray = typeof desc === 'string' ? [desc] : desc

  return h(
    'section',
    { [stencilaItemProp]: 'description' },
    h('h2', { [stencilaItemType]: microdataItemtype('Heading') }, 'Abstract'),
    h('meta', {
      itemprop: 'description',
      content: TxtCodec.stringify(desc),
    }),
    // Ensure that description is always wrapped in a paragraph
    descArray.every(stencila.isInlineContent)
      ? encodeNode(stencila.paragraph({ content: descArray }), state)
      : encodeNodes(descArray, state)
  )
}

function encodeReferencesProperty(
  references: (string | stencila.CreativeWork)[],
  state: EncodeState
): HTMLElement {
  return h(
    'section',
    { attrs: microdata(references, 'references', 'array') },
    h('h2', { [stencilaItemType]: microdataItemtype('Heading') }, 'References'),
    h(
      'ol',
      references.map((ref, index) => {
        const md = microdata(ref, 'references', 'item')

        if (typeof ref === 'string') {
          const id = `ref${index + 1}`
          return h('li', { attrs: { ...md, id } }, ref)
        }

        const {
          id = `ref${index + 1}`,
          authors = [],
          datePublished,
          title,
          url,
          isPartOf,
          publisher,
          identifiers,
        } = ref
        const titleElem = encodeTitleProperty(title, state, 'span')
        return h(
          'li',
          { attrs: { ...md, id } },
          encodeAuthorsProperty(authors),
          encodeMaybe(datePublished, (date) =>
            encodeDate(date, 'datePublished', '%Y')
          ),
          url !== undefined
            ? h('a', { itemprop: 'url', href: url }, titleElem)
            : titleElem,
          encodeIsPartOfProperty(isPartOf),
          stencila.isA('Article', ref)
            ? encodePaginationProperties(ref)
            : undefined,
          encodePublisherProperty(publisher),
          stencila.isA('Article', ref) ? encodeImageProperty(ref) : undefined,
          encodeIdentifiersProperty(identifiers)
        )
      })
    )
  )
}

interface CreativeWorkOptions {
  attrs?: { [key: string]: unknown }
  as?: keyof HTMLElementTagNameMap
}

const defaultCreativeWorkOptions: CreativeWorkOptions = {
  attrs: {},
}

type CreativeWorkTagMap = {
  [key in stencila.CreativeWork['type']]: keyof HTMLElementTagNameMap
}

const creativeWorkTagMap: CreativeWorkTagMap = {
  Article: 'article',
  AudioObject: 'audio',
  Claim: 'div',
  Collection: 'div',
  Comment: 'div',
  CreativeWork: 'div',
  Datatable: 'div',
  Figure: 'figure',
  ImageObject: 'div',
  MediaObject: 'div',
  Periodical: 'div',
  PublicationIssue: 'div',
  PublicationVolume: 'div',
  Review: 'div',
  SoftwareApplication: 'div',
  SoftwareSourceCode: 'div',
  Table: 'div',
  VideoObject: 'video',
}

function decodeCreativeWork(work: HTMLElement): stencila.CreativeWork {
  const workSelectorAll = propSelectorAll(work)
  const workSelector = propSelector(work)
  const headline = workSelector('headline')
  const url = workSelector('url')

  return stencila.creativeWork({
    title: headline?.textContent ?? 'Untitled',
    authors: workSelectorAll('author').map(decodePerson),
    funders: workSelectorAll('funder').map(decodePerson),
    editors: workSelectorAll('editor').map(decodePerson),
    url: url?.getAttribute('href') ?? undefined,
    ...propsToValues(work)(['dateCreated', 'dateModified', 'datePublished']),
  })
}

function encodeCreativeWork(
  work: stencila.CreativeWork,
  state: EncodeState,
  { attrs, as }: CreativeWorkOptions = defaultCreativeWorkOptions
): HTMLElement {
  const {
    title,
    url,
    authors = [],
    publisher,
    datePublished,
    content = [],
  } = work
  return h(
    as ?? creativeWorkTagMap[work.type] ?? 'div',
    // @ts-ignore
    encodeAttrs(work, attrs),
    encodePublisherProperty(publisher),
    encodeTitleProperty(title, state, 'span'),
    isA('Article', work) ? encodeImageProperty(work) : [],
    encodeAuthorsProperty(authors),
    encodeMaybe(datePublished, (date) => encodeDate(date, 'datePublished')),
    encodeMaybe(url, h('a', { itemprop: 'url', href: url }, url)),
    encodeNodes(content, state)
  )
}

function decodePerson(person: HTMLElement): stencila.Person {
  const url = person.querySelector('a')
  const href = url?.getAttribute('href')
  const personProps = propValue(person)

  return stencila.person({
    url: href ?? undefined,
    familyNames: [personProps('familyName')].filter(isDefined),
    givenNames: [personProps('givenName')].filter(isDefined),
  })
}

/**
 * Encode a `Person` node.
 *
 * - Ensures an `itemprop=name` for conformance with GSDTT.
 *
 * - Creates a link between the `Person` and the `Organization`
 *   that they are affiliated with.
 *
 * @param person The `Person` to encode
 * @param property The property that the person belongs to
 * @param organizations A map of `Organization`s to allow linking
 * @param tag The tag to use for the element
 */
function encodePerson(
  person: stencila.Person,
  property = 'authors',
  organizations?: { [key: string]: [number, stencila.Organization] },
  tag: keyof HTMLElementTagNameMap = 'span'
): HTMLElement {
  const {
    name,
    givenNames = [],
    familyNames = [],
    url,
    emails,
    affiliations,
    ...lost
  } = person
  logWarnLossIfAny('html', 'encode', person, lost)

  const nameString =
    name !== undefined
      ? name
      : familyNames.length !== 0
      ? givenNames.length !== 0
        ? [...givenNames, ...familyNames].join(' ')
        : familyNames.join(' ')
      : 'Anonymous'

  const nameElem =
    familyNames.length === 0 && givenNames.length === 0
      ? // Display the calculated `nameString` if no given or family names
        h('span', microdata(nameString, 'name'), nameString)
      : // Otherwise, use a <meta> tag
        h('meta', { ...microdata(nameString, 'name'), content: nameString })

  const givenNamesElem =
    givenNames.length !== 0
      ? h(
          'span',
          microdata(givenNames, 'givenNames', 'array'),
          givenNames.map((givenName) =>
            h('span', microdata(givenName, 'givenNames', 'item'), givenName)
          )
        )
      : undefined

  const familyNamesElem =
    familyNames.length !== 0
      ? h(
          'span',
          microdata(familyNames, 'familyNames', 'array'),
          familyNames.map((familyName) =>
            h('span', microdata(familyName, 'familyNames', 'item'), familyName)
          )
        )
      : undefined

  const affiliationsElem =
    affiliations !== undefined && organizations !== undefined
      ? h(
          'span',
          microdata(affiliations, 'affiliations', 'array'),
          affiliations.map((affiliation) => {
            const entry = organizations[affiliation.name ?? '']
            if (entry !== undefined) {
              const [index, org] = entry
              return h(
                'a',
                {
                  ...microdata(affiliation, 'affiliations', 'item'),
                  href: org?.meta?.itemid,
                },
                index
              )
            }
            return undefined
          })
        )
      : undefined

  return h(
    tag,
    { attrs: microdata(person, property) },
    nameElem,
    givenNamesElem,
    familyNamesElem,
    encodeEmailsProperty(emails),
    affiliationsElem
  )
}

function encodeOrganization(
  org: stencila.Organization,
  property?: string,
  tag: keyof HTMLElementTagNameMap = 'span'
): HTMLElement {
  const {
    id,
    name,
    url,
    address,
    contactPoints,
    members,
    meta,
    parentOrganization,
    ...lost
  } = org
  logWarnLossIfAny('html', 'encode', org, lost)

  const nameElem = h('span', { itemprop: 'name' }, name)
  const linkElem =
    url !== undefined
      ? h('a', { itemprop: 'url', content: url, href: url }, nameElem)
      : nameElem

  return h(
    tag,
    encodeAttrs(org, {
      itemid: meta?.itemid,
      id: meta?.itemid.replace(/^#/, '') ?? id,
      ...(property !== undefined ? microdataProperty(property) : {}),
    }),
    linkElem,
    encodeMaybe(parentOrganization, (org) =>
      encodeOrganization(org, 'parentOrganization')
    ),
    encodeAddressProperty(address),
    encodeEmailsProperty(
      contactPoints?.reduce(
        (prev: string[], { emails }) =>
          emails && emails.length > 0 ? [...prev, ...emails] : prev,
        []
      )
    ),
    encodeMaybe(members, (members) =>
      h(
        'ol',
        { attrs: { [stencilaItemProp]: 'members' } },
        members.map((member) =>
          stencila.isA('Person', member)
            ? encodePerson(member, 'members', undefined, 'li')
            : encodeOrganization(member, 'members', 'li')
        )
      )
    )
  )
}

/**
 * Encode an `address` property.
 *
 * For `PostalAddress` types, this follows the
 * Microdata examples at https://schema.org/address
 * except that it uses an `<address>` element instead of a `<div>`.
 */
function encodeAddressProperty(
  address: stencila.Organization['address'],
  tag: keyof HTMLElementTagNameMap = 'address',
  property = 'address'
): HTMLElement | undefined {
  if (address === undefined) return undefined

  if (typeof address === 'string')
    return h(tag, { attrs: microdata(address, property) }, address)

  const {
    postOfficeBoxNumber,
    streetAddress,
    addressLocality,
    addressRegion,
    addressCountry,
    ...lost
  } = address
  logWarnLossIfAny('html', 'encode', address, lost)

  const parts = {
    postOfficeBoxNumber,
    streetAddress,
    addressLocality,
    addressRegion,
    addressCountry,
  }

  return h(
    tag,
    { attrs: microdata(address, property) },
    ...Object.entries(parts).map(([property, value]) =>
      value !== undefined
        ? h('span', { attrs: microdata(value, property) }, value)
        : undefined
    )
  )
}

/**
 * Encode the `emails` property.
 */
function encodeEmailsProperty(
  emails: string[] | undefined
): HTMLElement | undefined {
  return emails !== undefined
    ? h(
        'span',
        microdata(emails, 'emails', 'array'),
        emails.map((email) =>
          h(
            'a',
            {
              ...microdata(email, 'emails', 'item'),
              href: `mailto:${email}`,
            },
            email
          )
        )
      )
    : undefined
}

/**
 * Encode a Stencila `Include` node to a Microdata `div[itemtype]` element.
 *
 * TODO: This is an initial implementation and it is probably better to generalize
 * it into a default encoding function to replace `encodeThing`.
 */
function encodeInclude(
  include: stencila.Include,
  state: EncodeState
): HTMLElement {
  const { content = [] } = include
  const contentDiv = h('div', encodeNodes(content, state))
  contentDiv.setAttribute('itemprop', 'content')
  return h(`div`, encodeAttrs(include), contentDiv)
}

/**
 * Decode a `<h1-6>` element to a `Heading` node.
 *
 * This assumes that the document uses `<h1>` for the document's
 * title (extracted elsewhere) only and
 *  `<h2>, <h3>,...` for level sections headings.
 * See `encodeHeading` for rationale.
 */
function decodeHeading(
  heading: HTMLHeadingElement,
  depth: number
): stencila.Heading {
  return stencila.heading({
    depth: Math.max(1, depth - 1),
    content: decodeInlineChildNodes(heading),
  })
}

/**
 * Encode a `Heading` node to a `<h2>`, `<h3>` etc element.
 *
 * > Generally, it is a best practice to ensure that the beginning of a
 * > page's main content starts with a h1 element, and also to ensure
 * > that the page contains only one h1 element.
 * > From https://dequeuniversity.com/rules/axe/3.5/page-has-heading-one
 *
 * This codec follows that recommendation and reserves `<h1>` for the
 * `title` property of a document.
 *
 * In rare cases that there is no content in the heading, return an empty
 * text node to avoid the 'Heading tag found with no content' accessibility error.
 */
function encodeHeading(
  heading: stencila.Heading,
  state: EncodeState
): HTMLHeadingElement | Text {
  let { id, depth = 0, content } = heading

  if (content.length === 0) return document.createTextNode('')

  const text = TxtCodec.stringify(heading)
  id = id !== undefined ? id : slugger.slug(text)
  return h<HTMLHeadingElement>(
    `h${Math.min(depth + 1, 6)}`,
    { attrs: { ...microdata(heading), id } },
    encodeNodes(content, state)
  )
}

/**
 * Decode a `<p>` element to a `stencila.Paragraph`.
 */
function decodeParagraph(para: HTMLParagraphElement): stencila.Paragraph {
  return stencila.paragraph({ content: decodeInlineChildNodes(para) })
}

/**
 * Encode a `stencila.Paragraph` to a `<p>` element.
 */
function encodeParagraph(
  para: stencila.Paragraph,
  state: EncodeState
): HTMLParagraphElement {
  return h('p', { attrs: microdata(para) }, encodeNodes(para.content, state))
}

/**
 * Decode a `<blockquote>` element to a `stencila.QuoteBlock`.
 */
function decodeBlockquote(elem: HTMLQuoteElement): stencila.QuoteBlock {
  return stencila.quoteBlock({
    content: decodeBlockChildNodes(elem),
    cite: elem.getAttribute('cite') ?? undefined,
  })
}

/**
 * Encode a `stencila.QuoteBlock` to a `<blockquote>` element.
 */
function encodeQuoteBlock(
  block: stencila.QuoteBlock,
  state: EncodeState
): HTMLQuoteElement {
  const { cite, content } = block
  return h(
    'blockquote',
    { attrs: microdata(block), cite },
    encodeNodes(content, state)
  )
}

// Regex to test if a string is a URL. Thanks to https://stackoverflow.com/a/3809435
const urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi

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
  const prefix = elem.querySelector('[data-itemprop="citationPrefix"]')
  const suffix = elem.querySelector('[data-itemprop="citationSuffix"]')

  return stencila.cite({
    target: decodeHref(target?.getAttribute('href') ?? '#'),
    citationPrefix: isDefined(prefix)
      ? prefix.textContent ?? undefined
      : undefined,
    citationSuffix: isDefined(suffix)
      ? suffix.textContent ?? undefined
      : undefined,
  })
}

/**
 * Encode a `stencila.Cite` to a `<cite>` element.
 */
function encodeCite(cite: stencila.Cite, state: EncodeState): HTMLElement {
  const {
    citationPrefix,
    target,
    citationSuffix,
    content,
    citationMode,
    ...lost
  } = cite
  logWarnLossIfAny('html', 'encode', cite, lost)

  // If there is no existing citation content (ie. the visible text of
  // the citation) then create it.
  let contentElems: string | Node[]
  if (content === undefined || content.length === 0) {
    const reference = state.references?.find((ref, index) =>
      typeof ref === 'string'
        ? `ref${index + 1}` === target || `bib${index + 1}` === target
        : ref.id === target
    )
    if (reference === undefined) {
      contentElems = target
    } else {
      const number = encodeCiteNumeric(reference, state.references)
      contentElems = [h('span', number)]

      if (stencila.isIn('CreativeWorkTypes', reference)) {
        const authors = encodeCiteAuthors(reference)
        // For theming, always add authors span so that year span is
        // always the third span (if present)
        contentElems = [...contentElems, h('span', authors ?? '')]

        const year = encodeCiteYear(reference)
        // For theming, only add year span if a year is available
        // to prevent e.g. Smith ()
        if (year !== undefined)
          contentElems = [...contentElems, h('span', year)]
      }
    }
  } else {
    contentElems = encodeNodes(content, state)
  }

  return h(
    'cite',
    // Citation mode is added as an attribute (`data-citationmode`)
    // rather than as a separate <meta> tag because that is more useful
    // for theming and because `citationMode` is not a schema.org property
    // anyway.
    encodeAttrs(cite, { citationMode }),
    encodeMaybe(citationPrefix, (value) =>
      h('span', microdata(value, 'citationPrefix'), value)
    ),
    h('a', { href: encodeHref(target) }, contentElems),
    encodeMaybe(citationSuffix, (value) =>
      h('span', microdata(value, 'citationSuffix'), value)
    )
  )
}

/**
 * Decode a `<ol itemtype="https://schema.stenci.la/CiteGroup">` element to
 * a `stencila.CiteGroup`.
 */
function decodeCiteGroup(citeGroup: HTMLOListElement): stencila.CiteGroup {
  return stencila.citeGroup({
    items: [...citeGroup.querySelectorAll<HTMLElement>('cite')].map(decodeCite),
  })
}

/**
 * Encode a `stencila.CiteGroup` element to a `<ol itemtype="https://schema.stenci.la/CiteGroup">`.
 */
function encodeCiteGroup(
  citeGroup: stencila.CiteGroup,
  state: EncodeState
): HTMLElement {
  return h(
    'span',
    encodeAttrs(citeGroup),
    citeGroup.items.map((item) => encodeCite(item, state))
  )
}

/**
 * Decode a `<figure>` element to a `stencila.Figure`.
 */
function decodeFigure(elem: HTMLElement): stencila.Figure {
  const content = decodeNodes(
    [...elem.childNodes].filter(
      (n) => n.nodeName.toLowerCase() !== 'figcaption'
    )
  )

  const caption = elem.querySelector('figcaption')

  return stencila.figure({
    id: elem.getAttribute('id') ?? undefined,
    content,
    caption:
      caption !== null
        ? ensureBlockContentArrayOrUndefined(decodeFigCaption(caption))
        : undefined,
  })
}

/**
 * Decode a `<figcaption>` element to an array of `BlockContent`.
 *
 * A [`<figcaption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption)
 * can include block content such as `<h1>` and inline content such as `<em>`.
 */
function decodeFigCaption(elem: HTMLElement): stencila.Node[] {
  return decodeChildNodes(elem)
}

/**
 * Encode a `stencila.Figure` element to a `<figure>`.
 */
function encodeFigure(
  figure: stencila.Figure,
  state: EncodeState
): HTMLElement {
  const { id, label, caption, content = [] } = figure
  return h('figure', encodeAttrs(figure, { id, title: label }), [
    encodeMaybe(label, (label) =>
      h('label', microdataProperty('label'), label)
    ),
    encodeNodes(content, state),
    encodeMaybe(caption, (caption) =>
      h(
        'figcaption',
        typeof caption === 'string' ? caption : encodeNodes(caption, state)
      )
    ),
  ])
}

/**
 * Decode a `<ol itemtype="https://schema.stenci.la/Collection">` element to a `stencila.Collection`.
 */
function decodeCollection(collection: HTMLOListElement): stencila.Collection {
  const meta = decodeDataAttrs(collection)
  const parts = flatten(
    [...collection.childNodes].map(decodeChildNodes)
  ).filter(stencila.isMember('CreativeWorkTypes'))
  return stencila.collection({ meta, parts })
}

/**
 * Encode a `stencila.Collection` node to a `<ol itemtype="https://schema.stenci.la/Collection">` element.
 *
 * Adds the `usage` meta property, if it exists, as a `data-usage` attribute (since it is
 * not an official property of the Schema, it shouldn't be added as a `itemprop` or `data-itemprop`)
 */
function encodeCollection(
  collection: stencila.Collection,
  state: EncodeState
): HTMLOListElement {
  const { meta, parts } = collection
  return h(
    'ol',
    encodeAttrs(collection, meta),
    parts.map((entry) => h('li', encodeNode(entry, state)))
  )
}

/**
 * Decode a `<pre><code class="language-xxx">` element to a `stencila.CodeBlock`.
 */
function decodeCodeBlock(elem: HTMLPreElement): stencila.CodeBlock {
  const code = elem.querySelector('code')
  if (code === null) throw new Error('Woaah, this should never happen!')
  const { programmingLanguage, text } = decodeCodeFragment(code)
  const meta = decodeDataAttrs(elem)
  return stencila.codeBlock({ programmingLanguage, text, meta })
}

/**
 * Encode a `CodeBlock` to a `<pre class="language-xxx"><code>` element.
 *
 * If the `CodeBlock` has a `meta` property, any keys are added as attributes to
 * the `<pre>` element with a `data-` prefix.
 */
function encodeCodeBlock(block: stencila.CodeBlock): HTMLElement {
  return encodeCode(block, 'pre', h('code', { innerHTML: escape(block.text) }))
}

/**
 * Decode a `<stencila-code-chunk>` element to a Stencila `CodeChunk`.
 */
function decodeCodeChunk(chunk: HTMLElement): stencila.CodeChunk {
  const codeElem = chunk.querySelector('[slot="text"]')
  const codeFrag = decodeCodeFragment(codeElem as HTMLElement)
  const { text, programmingLanguage } = codeFrag

  const outputElems = chunk.querySelectorAll('[slot="outputs"] > *')
  const outputs = Array.from(outputElems).map((elem) =>
    decodeCodeOutput(elem as HTMLElement)
  )

  return stencila.codeChunk({ text, programmingLanguage, outputs })
}

/**
 * Encode a Stencila `CodeChunk` to a `<stencila-code-chunk>` element.
 *
 * If the code chunk has a label or a caption then it is encoded as a figure
 * with the code chunk as the content.
 */
function encodeCodeChunk(
  chunk: stencila.CodeChunk,
  state: EncodeState
): HTMLElement {
  const {
    text = '',
    programmingLanguage,
    meta = {},
    outputs,
    id,
    caption,
    label,
  } = chunk

  if (id !== undefined || caption !== undefined || label !== undefined) {
    return encodeFigure(
      stencila.figure({
        id,
        label,
        caption,
        content: [
          stencila.codeChunk({
            text,
            programmingLanguage,
            meta,
            outputs,
          }),
        ],
      }),
      state
    )
  }

  const codeElem = encodeCodeBlock(
    stencila.codeBlock({ text, programmingLanguage })
  )
  codeElem.setAttribute('slot', 'text')

  const outputsElem = encodeMaybe(outputs, (outputs) =>
    h(
      'figure',
      {
        attrs: {
          slot: 'outputs',
        },
      },
      outputs.map((output) => encodeCodeOutput(output, state))
    )
  )

  return h(
    'stencila-code-chunk',
    encodeAttrs(chunk, { ...meta, programmingLanguage }),
    codeElem,
    outputsElem
  )
}

/**
 * Decode a `<stencila-code-expression>` element to a Stencila `CodeExpression`.
 */
function decodeCodeExpression(elem: HTMLElement): stencila.CodeExpression {
  const codeElem = elem.querySelector('[slot="text"]')
  const { text, ...codeFragment } = decodeCodeFragment(codeElem as HTMLElement)
  const programmingLanguage =
    elem.getAttribute('programming-language') ??
    codeFragment.programmingLanguage

  const outputElem = elem.querySelector('[slot="output"]')
  const output =
    outputElem !== null
      ? decodeCodeOutput(outputElem as HTMLElement)
      : undefined

  return stencila.codeExpression({ text, programmingLanguage, output })
}

/**
 * Encode a Stencila `CodeExpression` to a `<stencila-code-expression>` element.
 */
function encodeCodeExpression(
  expr: stencila.CodeExpression,
  state: EncodeState
): HTMLElement {
  const { meta = {}, text, programmingLanguage, output = '' } = expr

  const attrs = encodeDataAttrs(meta)
  if (programmingLanguage !== undefined)
    attrs['programming-language'] = programmingLanguage

  let outputElem
  if (isInlineContent(output)) outputElem = encodeNode(output, state)
  else {
    log.warn(`CodeExpression output is not InlineContent: ${nodeType(output)}`)
    outputElem = ''
  }

  return h(
    'stencila-code-expression',
    {
      attrs: { ...attrs, ...microdata(expr) },
    },
    [
      h('code', { class: programmingLanguage, attrs: { slot: 'text' } }, text),
      h('output', { attrs: { slot: 'output' } }, outputElem),
    ]
  )
}

/**
 * Decode an output element of a `<stencila-code-chunk>` or
 * `<stencila-code-expression>` to Stencila Node.
 */
const decodeCodeOutput = (elem: HTMLElement): stencila.Node => {
  switch (elem.nodeName.toLowerCase()) {
    case 'output':
    case 'pre':
    case 'span':
      return elem.textContent ?? ''
    default:
      return decodeNode(elem)
  }
}

/**
 * Encode an output of a `CodeChunk` as an `HTMLElement`.
 */
const encodeCodeOutput = (node: stencila.Node, state: EncodeState): Node => {
  switch (nodeType(node)) {
    case 'String':
      return h('pre', h('output', node as string))
    default:
      return encodeNode(node, state)
  }
}

/**
 * Decode a `<ul>` or `<ol>` element to a `stencila.List`.
 */
function decodeList(list: HTMLUListElement | HTMLOListElement): stencila.List {
  const order = list.tagName === 'UL' ? 'Unordered' : 'Ascending'
  return stencila.list({
    order,
    items: [...list.querySelectorAll('li')].map(decodeListItem),
  })
}

/**
 * Encode a `stencila.List` to a `<ul>` or `<ol>` element.
 *
 * GSDTT requires that each `ListItem` have a `position`.
 * So this function generates a default position (overridden
 * if an item has one) based on the order of items.
 */
function encodeList(
  list: stencila.List,
  state: EncodeState
): HTMLUListElement | HTMLOListElement {
  return h(
    list.order === 'Unordered' ? 'ul' : 'ol',
    { attrs: microdata(list) },
    list.items.map((item, index) =>
      encodeNode(
        {
          position: item.position ?? index + 1,
          ...item,
        },
        state
      )
    )
  )
}

/**
 * Decode a `<li>` element to a `stencila.ListItem`.
 */
function decodeListItem(li: HTMLLIElement): stencila.ListItem {
  return stencila.listItem({ content: decodeChildNodes(li) })
}

/**
 * Encode a `stencila.ListItem` to a `<li>` element.
 *
 * If the `content` of the `ListItem` is a single `Paragraph`
 * then it is "unwrapped".
 *
 * GSDTT requires `position` and `url` on each item.
 * This function ensures that.
 */
function encodeListItem(
  listItem: stencila.ListItem,
  state: EncodeState,
  property = 'items'
): HTMLLIElement {
  const { content = [], isChecked, id, position, url } = listItem
  return h(
    'li',
    { attrs: microdata(listItem, property), id: id ?? null },
    h('meta', { attrs: { itemprop: 'position', content: position } }),
    h('meta', { attrs: { itemprop: 'url', content: url ?? `#${position}` } }),
    isChecked === undefined
      ? undefined
      : h('input', { type: 'checkbox', ...(isChecked ? { checked: '' } : {}) }),
    content.length === 1 && stencila.isA('Paragraph', content[0])
      ? encodeNodes(content[0].content, state)
      : encodeNodes(content, state)
  )
}

/**
 * Decode a `<table>` element to a `stencila.Table`.
 */
function decodeTable(table: HTMLTableElement): stencila.Table {
  return stencila.table({
    id: table.getAttribute('id') ?? undefined,
    rows: Array.from(table.querySelectorAll('tr')).map(decodeTableRow),
  })
}

/**
 * Encode a `stencila.Table` to a `<table>` element.
 *
 * The `label` property must be nested within the `<caption>`
 * element (it can't be directly under `<table>`).
 */
function encodeTable(
  table: stencila.Table,
  state: EncodeState
): HTMLTableElement {
  const { id, label, caption, rows } = table

  const headerRows = takeLeftWhile(
    (row: stencila.TableRow) => row.rowType === 'Header'
  )(rows)

  const bodyRows: stencila.TableRow[] = dropLeft(headerRows.length)(rows)

  return h(
    'table',
    { id, attrs: microdata(table) },
    encodeMaybe(
      label ?? caption,
      h(
        'caption',
        encodeMaybe(label, h('label', microdataProperty('label'), label)),
        encodeMaybe(caption, (caption) => {
          return h(
            'div',
            microdataProperty('caption'),
            typeof caption === 'string' ? caption : encodeNodes(caption, state)
          )
        })
      )
    ),
    encodeMaybe(
      headerRows,
      h(
        'thead',
        headerRows.map((row) => encodeTableRow(row, state))
      )
    ),
    h(
      'tbody',
      bodyRows.map((row) => encodeTableRow(row, state))
    )
  )
}

/**
 * Decode a `<tr>` element to a `stencila.TableRow`.
 */
function decodeTableRow(row: HTMLTableRowElement): stencila.TableRow {
  const parent = row.parentElement?.nodeName.toLowerCase()
  return stencila.tableRow({
    rowType: parent === 'thead' ? 'Header' : undefined,
    cells: Array.from(
      row.querySelectorAll<HTMLTableHeaderCellElement | HTMLTableCellElement>(
        'th, td'
      )
    ).map(decodeTableCell),
  })
}

/**
 * Encode a `stencila.TableRow` to a `<tr>` element.
 */
function encodeTableRow(
  row: stencila.TableRow,
  state: EncodeState
): HTMLTableRowElement {
  const cellTag = row.rowType === 'Header' ? 'th' : 'td'
  return h(
    'tr',
    { attrs: microdata(row) },
    row.cells.map((cell) => encodeTableCell(cell, state, cellTag))
  )
}

/**
 * Decode a `<td>` element to a `stencila.TableCell`.
 */
function decodeTableCell(cell: HTMLTableDataCellElement): stencila.TableCell {
  return stencila.tableCell({
    content: decodeInlineChildNodes(cell),
  })
}

/**
 * Encode a `stencila.TableCell` to a `<td>` or a `<th>` element.
 */
function encodeTableCell(
  cell: stencila.TableCell,
  state: EncodeState,
  tag: 'td' | 'th' = 'td'
): HTMLTableDataCellElement {
  return h(tag, { attrs: microdata(cell) }, encodeNodes(cell.content, state))
}

/**
 * Decode a `<div itemtype="https://schema.stenci.la/Datatable">` element to a Stencila `Datatable` node.
 */
function decodeDatatable(elem: HTMLElement): stencila.Datatable {
  let columns: stencila.DatatableColumn[] = []
  const table = elem.querySelector('table')
  if (table !== null) {
    const thead = table.querySelector('thead')
    if (thead !== null) {
      columns = Array.from(thead.querySelectorAll('tr th')).map(
        (row, index): stencila.DatatableColumn => {
          const th = row.querySelector('th')
          const name = th?.innerText ?? columnIndexToName(index)
          return stencila.datatableColumn({
            name,
            values: [],
          })
        }
      )
    }

    const tbody = table.querySelector('tbody')
    if (tbody !== null) {
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

  return stencila.datatable({ columns })
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
  const rows = cols?.[0].values.map((_, row) => row) ?? []

  // prettier-ignore
  return h('div',
    encodeAttrs(datatable),
    h('table',
      h('thead',
        h('tr', cols.map(col => (
          h('th', col.name)
        )))
      ),
      h('tbody',rows.map((_, row) => (
        h('tr', cols.map(col => (
          h('td', {attrs: microdata(col)}, col.values[row])
        )))
      )))
    )
  )
}

/**
 * Decode a `<hr>` element to a `stencila.ThematicBreak`.
 */
function decodeHR(): stencila.ThematicBreak {
  return stencila.thematicBreak()
}

/**
 * Encode a `stencila.ThematicBreak` to a `<hr>` element.
 */
function encodeThematicBreak(): HTMLHRElement {
  return h('hr', { attrs: microdata(thematicBreak()) })
}

/**
 * Decode an inline element e.g `<em>` to a `Mark` node e.g. `Emphasis`.
 */
function decodeMark(
  elem: HTMLElement,
  type: stencila.Mark['type']
): stencila.Mark {
  return { type, content: decodeInlineChildNodes(elem) }
}

/**
 * Encode a `Mark` node to an inline element e.g. `<em>`.
 */
function encodeMark(
  node: stencila.Mark,
  state: EncodeState,
  tag: string
): HTMLElement {
  return h(tag, { attrs: microdata(node) }, encodeNodes(node.content, state))
}

/**
 * Decode a `<a>` element to a `stencila.Link`.
 */
function decodeLink(elem: HTMLAnchorElement): stencila.Link {
  return stencila.link({
    target: elem.getAttribute('href') ?? '#',
    content: decodeInlineChildNodes(elem),
    meta: decodeDataAttrs(elem),
  })
}

/**
 * Encode a `stencila.Link` to a `<a>` element.
 */
function encodeLink(
  link: stencila.Link,
  state: EncodeState
): HTMLAnchorElement {
  const attrs = {
    ...encodeDataAttrs(link.meta ?? {}),
    href: link.target,
    attrs: microdata(link),
  }
  return h('a', attrs, encodeNodes(link.content, state))
}

/**
 * Decode a `<q>` element to a `stencila.Quote`.
 */
function decodeQuote(elem: HTMLQuoteElement): stencila.Quote {
  return stencila.quote({
    content: [elem.innerHTML],
    cite: elem.getAttribute('cite') ?? undefined,
  })
}

/**
 * Encode a `stencila.Quote` to a `<q>` element.
 */
function encodeQuote(quote: stencila.Quote): HTMLQuoteElement {
  return h('q', { attrs: microdata(quote), cite: quote.cite }, quote.content)
}

/**
 * Decode a `<code>` element to a `stencila.CodeFragment`.
 */
function decodeCodeFragment(elem: HTMLElement): stencila.CodeFragment {
  const codeFrag = stencila.codeFragment({ text: elem.textContent ?? '' })
  const clas = elem.getAttribute('class')
  if (clas !== null) {
    const match = /^language-(\w+)$/.exec(clas)
    if (match !== null) {
      codeFrag.programmingLanguage = match[1]
    }
  }
  const meta = decodeDataAttrs(elem)
  if (meta !== undefined) codeFrag.meta = meta
  return codeFrag
}

/**
 * Encode a `CodeFragment` or `CodeBlock` to an element.
 */
function encodeCode(
  node: stencila.CodeFragment | stencila.CodeBlock,
  tag: keyof HTMLElementTagNameMap,
  ...children: HTMLElement[]
): HTMLElement {
  const { meta = {}, programmingLanguage } = node
  return h(
    tag,
    {
      attrs: { ...microdata(node), ...encodeDataAttrs(meta) },
      class:
        programmingLanguage !== undefined
          ? `language-${programmingLanguage}`
          : undefined,
    },
    children
  )
}

/**
 * Encode a `stencila.CodeFragment` to a `<code>` element.
 */
function encodeCodeFragment(codeFrag: stencila.CodeFragment): HTMLElement {
  const elem = encodeCode(codeFrag, 'code')
  elem.innerHTML = escape(codeFrag.text)
  return elem
}

/**
 * Decode a HTML `<img>` element to a Stencila `ImageObject`.
 */
function decodeImage(elem: HTMLImageElement): stencila.ImageObject {
  const src = elem.getAttribute('src') ?? ''
  const { title, alt } = elem
  return stencila.imageObject({
    contentUrl: src,
    title: title.length > 0 ? title : undefined,
    text: alt.length > 0 ? alt : undefined,
  })
}

/**
 * Encode a Stencila `AudioObject` to a HTML `<audio>` element.
 */
function encodeAudioObject(
  audio: stencila.AudioObject,
  property?: string
): HTMLAudioElement {
  const { contentUrl: src } = audio
  return h(
    'audio',
    {
      attrs: microdata(audio, property),
      controls: '',
    },
    h('source', { src }),
    h('p', 'Your browser does not support audio elements.')
  )
}

/**
 * Encode a Stencila `ImageObject` to a HTML `<img>` or `<picture>` element.
 *
 * If the image has a `content` property with a known `mediaType` property, then
 * returns a custom element of that type e.g. `<stencila-image-plotly>`.
 *
 * Otherwise, encodes the image's `contentUrl` to the `src` on an `<img>` and ensures that
 * the `alt` attribute is always set (with an empty string if there is no source
 * for that attribute).
 */
function encodeImageObject(
  image: stencila.ImageObject,
  enhanced = true,
  property?: string
): HTMLImageElement | HTMLElement {
  const { contentUrl: src, title, text, content = [] } = image

  if (enhanced && content.length > 0) {
    for (const node of content) {
      if (typeof node === 'object' && node !== null && 'mediaType' in node) {
        if (node.mediaType === plotlyMediaType && 'data' in node) {
          return encodeImageObjectPlotly(image, node.data)
        } else if (isVegaMediaType(node.mediaType) && 'spec' in node) {
          return encodeImageObjectVega(image, node.spec)
        }
      }
    }
  }

  const titleString = title !== undefined ? TxtCodec.stringify(title) : null
  return h('img', {
    attrs: microdata(image, property),
    src,
    title: titleString,
    alt: text ?? titleString ?? property ?? '',
  })
}

/**
 * Encode an `ImageObject` with Plotly content to a `<stencila-image-plotly>` element.
 */
function encodeImageObjectPlotly(
  image: stencila.ImageObject,
  data: unknown
): HTMLElement {
  return h(
    'stencila-image-plotly',
    h(
      'picture',
      h('script', {
        type: plotlyMediaType,
        innerHTML: JSON.stringify(data),
      }),
      encodeImageObject(image, false)
    )
  )
}

/**
 * Encode an `ImageObject` with Vega content to a `<stencila-image-vega>` element.
 */
function encodeImageObjectVega(
  image: stencila.ImageObject,
  data: unknown
): HTMLElement {
  return h(
    'stencila-image-vega',
    h(
      'picture',
      h('script', {
        type: vegaMediaType,
        innerHTML: JSON.stringify(data),
      }),
      encodeImageObject(image, false)
    )
  )
}

/**
 * Encode a Stencila `VideoObject` to a HTML `<video>` element.
 */
function encodeVideoObject(
  video: stencila.VideoObject,
  property?: string
): HTMLVideoElement {
  const { contentUrl: src } = video
  return h(
    'video',
    {
      attrs: microdata(video, property),
      controls: '',
    },
    h('source', { src }),
    h('p', 'Your browser does not support video elements.')
  )
}

/**
 * Decode a HTML `<math>` element (i.e. embedded MathML) to either a
 * Stencila `MathFragment` or `MathBlock` depending on the
 * [`display`](https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math#attr-display)
 * attribute.
 *
 * TODO: This, and `encodeMath`, are preliminary implementations, mainly to try
 * out the new `MathFragment` and `MatchBlock` schema types with HTML. They need
 * to be able to deal with languages other than MathML e.g. TeX, ASCIIMath, probably by encoding
 * `text` in HTML and using KaTeX for genenerating display HTML (since MathMl is
 * not widely supported).
 */
function decodeMath(elem: HTMLElement): stencila.Math {
  const text = elem.innerHTML
  const mathLanguage = 'mathml'
  const display = elem.getAttribute('display')
  return (display === 'block' ? stencila.mathBlock : stencila.mathFragment)({
    text,
    mathLanguage,
  })
}

/**
 * Encode a Stencila `Math` node to a HTML.
 *
 * Uses MathJax to render math as HTML because (a) native MathML support is
 * [limited](https://caniuse.com/#feat=mathml) and (b) MathJax rendering in the browser is slow.
 * See https://joa.sh/posts/2015-09-14-prerender-mathjax.html for pros and
 * cons of this approach.
 *
 * In the future this may be replace by a custom web component to allow for
 * editing math, similar to `encodeCodeChunk`.
 */
function encodeMath(math: stencila.Math): HTMLElement {
  const { text, mathLanguage } = math
  const format = mathLanguage?.toLowerCase()
  const elem = h('span', {
    attrs: {
      ...microdata(math),
    },
  })
  mathJaxTypeset(elem, {
    math: text,
    format:
      format === 'mathml'
        ? 'MathML'
        : format === 'asciimath'
        ? 'AsciiMath'
        : stencila.isA('MathFragment', math)
        ? 'inline-TeX'
        : 'TeX',

    html: true,
    css: true,
  })
  return elem
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
  return h('span', encodeAttrs(null), 'null')
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
  return h('span', encodeAttrs(value), value === true ? 'true' : 'false')
}

/**
 * Decode a `<span itemtype="https://schema.org/Number>` element to a `number`.
 */
function decodeNumber(elem: HTMLElement): number {
  return parseFloat(elem.innerHTML.length > 0 ? elem.innerHTML : '0')
}

/**
 * Encode a `number` to a `<span itemtype="https://schema.org/Number>` element.
 */
function encodeNumber(value: number): HTMLElement {
  return h('span', encodeAttrs(value), value.toString())
}

/**
 * Decode a `<span itemtype="https://schema.stenci.la/Array>` element to a `array`.
 *
 * Wrap the decoded array with an array to prevent it getting flattened by `decodeNodes`
 */
function decodeArray(elem: HTMLElement): [any[]] {
  return [JSON5.parse(elem.innerHTML.length > 0 ? elem.innerHTML : '[]')]
}

/**
 * Encode a `array` to a `<span itemtype="https://schema.stenci.la/Array>` element.
 */
function encodeArray(value: any[]): HTMLElement {
  return h('span', encodeAttrs(value), JSON5.stringify(value))
}

/**
 * Decode a `<span itemtype="https://schema.stenci.la/Object>` element to a `object`.
 */
function decodeObject(elem: HTMLElement): object {
  return JSON5.parse(elem.innerHTML.length > 0 ? elem.innerHTML : '{}')
}

/**
 * Encode a `object` to a `<span itemtype="https://schema.stenci.la/Object>` element.
 */
function encodeObject(value: object): HTMLElement {
  return h('span', encodeAttrs(value), JSON5.stringify(value))
}

/**
 * Decode a `<span itemtype="...">` element to a `Entity`.
 */
function decodeEntity(elem: HTMLElement): stencila.Entity {
  const json = elem.textContent ?? '{}'
  try {
    return JSON5.parse(json)
  } catch (error) {
    const { stack } = error
    log.error({
      message: `Error parsing JSON: ${json}`,
      stack,
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
  return h('span', encodeAttrs(stencila.entity()), JSON5.stringify(entity))
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
 * Create an object with Microdata and other attributes for
 * a node to pass to Hyperscript's `h` functions.
 */
function encodeAttrs(
  node: stencila.Node,
  propertyOrExtra?: string | Record<string, string | undefined>,
  extra?: Record<string, string | undefined>
): { attrs: Record<string, unknown> } {
  const [property, extras] =
    typeof propertyOrExtra === 'string'
      ? [propertyOrExtra, extra]
      : [undefined, propertyOrExtra]
  return {
    attrs: {
      ...microdata(node, property),
      ...encodeDataAttrs(extras ?? {}),
    },
  }
}

/**
 * Decode the `data-` attributes of an element into a dictionary
 * of strings.
 */
function decodeDataAttrs(
  elem: HTMLElement
): Record<string, string> | undefined {
  const dict: Record<string, string> = {}
  Array.from(elem.attributes)
    .filter((attr) => attr.name.startsWith('data-'))
    .forEach((attr) => (dict[attr.name.slice(5)] = attr.value))
  return Object.keys(dict).length > 0 ? dict : undefined
}

// These attribute names are fully-formed, and should not be prefixed with `data-`
const reservedAttrs = [
  'id',
  'slot',
  'name',
  'title',
  'itemscope',
  'itemtype',
  'itemid',
  'itemprop',
  'itemref',
]

/**
 * Encode a dictionary of strings to `data-` attributes to add to
 * an element (the inverse of `decodeDataAttrs`).
 */
function encodeDataAttrs(
  meta: Record<string, string | undefined>
): typeof meta {
  return Object.entries(meta).reduce(
    (attrs, [key, value]) =>
      value !== undefined
        ? {
            ...attrs,
            [reservedAttrs.includes(key) ? key : `data-${key}`]: value,
          }
        : attrs,
    {}
  )
}
