/**
 * @module jats
 */

import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
import {
  isInlineContent,
  nodeType,
  markTypes,
  isType
} from '@stencila/schema/dist/util'
import fs from 'fs-extra'
import { Encode } from '../..'
import * as vfile from '../../util/vfile'
/* eslint-disable import/no-duplicates */
import * as xml from '../../util/xml'
import {
  elem,
  attr,
  child,
  first,
  all,
  text,
  textOrUndefined,
  splitTextOrUndefined,
  intOrUndefined
} from '../../util/xml'

const log = getLogger('encoda:jats')

/**
 * Media types that this codec will match.
 *
 * There is currently no registered
 * [media type](https://www.iana.org/assignments/media-types/media-types.xhtml)
 * for JATS.
 *
 * This custom type uses the [convention](https://en.wikipedia.org/wiki/XML_and_MIME)
 * of using `application/` and the `+xml` suffix to differentiate this format from other
 * XML-based formats.
 */
export const mediaTypes = ['application/jats+xml']

/**
 * File name extensions that this codec will match.
 */
export const extNames = ['jats']

/**
 * The DOCTYPE to use when encoding to JATS
 */
const DOCTYPE =
  'article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.1 20151215//EN" "JATS-archivearticle1.dtd"'

/**
 * Sniff content to see if it is JATS XML.
 *
 * For speed, rather than parsing the entire content as XML, this
 * function just uses a regex to checks if the content contains a
 * JATS DOCTYPE declaration.
 * Obviously, it's possible that a file in some other format (e.g. Markdown)
 * could contain this string.
 *
 * @param content The content to be sniffed
 */
export async function sniff(content: string): Promise<boolean> {
  if (await fs.pathExists(content)) {
    const stat = await fs.stat(content)
    if (stat.isFile()) content = await fs.readFile(content, 'utf8')
  }
  const regex = /<!DOCTYPE\s+article\s+PUBLIC\s+"|'-\/\/NLM\/\/DTD JATS \(Z39\.96\)/
  return regex.test(content)
}

/**
 * Decode a `VFile` with JATS content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const jats = await vfile.dump(file)
  const doc = xml.load(jats, { compact: false }) as xml.Element
  return decodeDocument(doc)
}

/**
 * Encode a Stencila `Node` to a `VFile` with JATS content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  const doc = encodeDocument(node)
  const jats = xml.dump(doc, { spaces: 4 })
  return vfile.load(jats)
}

/**
 * Decode a JATS XML document to a Stencila `Node`.
 */
function decodeDocument(doc: xml.Element): stencila.Node {
  const article = first(doc, 'article')
  return article ? decodeArticle(article) : null
}

/**
 * Encode a Stencila Node to a JATS XML document.
 */
function encodeDocument(node: stencila.Node): xml.Element {
  // TODO: construct article from fragment if necessary
  const article = node as stencila.Article
  return {
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'utf-8'
      }
    },
    elements: [
      {
        type: 'doctype',
        doctype: DOCTYPE
      },
      encodeArticle(article)
    ]
  }
}

function decodeArticle(elem: xml.Element): stencila.Article {
  const front = child(elem, 'front')

  const article = stencila.article(
    decodeAuthors(all(front, 'contrib', { 'contrib-type': 'author' }), elem),
    decodeTitle(first(front, 'article-title'))
  )

  const body = child(elem, 'body')
  if (body) article.content = decodeBody(body)

  const back = child(elem, 'back')
  const refList = first(back, 'ref-list')
  if (refList) article.references = decodeRefList(refList)

  return article
}

function encodeArticle(article: stencila.Article): xml.Element {
  const front = elem(
    'front',
    encodeTitle(article.title || ''),
    encodeAuthors(article.authors || [])
  )
  const body = encodeBody(article.content || [])
  const back = elem('back', encodeReferences(article.references || []))

  return elem(
    'article',
    {
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'article-type': 'research-article'
    },
    front,
    body,
    back
  )
}

function decodeTitle(title: xml.Element | null): string {
  return text(title)
}

function encodeTitle(title: string): xml.Element {
  return elem('title-group', elem('article-title', title))
}

function decodeAuthors(
  authors: xml.Element[],
  article: xml.Element
): stencila.Person[] {
  return authors.map(author => decodeAuthor(author, article))
}

function encodeAuthors(
  authors: (stencila.Person | stencila.Organization)[]
): xml.Element {
  const init: { auths: xml.Element[]; affs: xml.Element[] } = {
    auths: [],
    affs: []
  }
  const { auths, affs } = authors.map(encodeAuthor).reduce(
    (prev, curr) => ({
      auths: [...prev.auths, curr.auth],
      affs: [...prev.affs, ...curr.affs]
    }),
    init
  )
  return elem('contrib-group', ...auths, ...affs)
}

/**
 * Decode an author element to a `Person` node
 */
function decodeAuthor(
  author: xml.Element,
  article: xml.Element
): stencila.Person {
  const name = child(author, ['name', 'string-name'])
  const person: stencila.Person = name ? decodeName(name) : { type: 'Person' }

  const emails = all(author, 'email')
  if (emails.length) person.emails = emails.map(text)

  const affRefs = all(author, 'xref', { 'ref-type': 'aff' })
  if (affRefs.length) {
    person.affiliations = affRefs
      .map(ref => {
        const id = ref.attributes && ref.attributes['rid']
        const aff = first(article, 'aff', { id: id })
        if (!aff) {
          log.warn(`Could not find <aff id=${id}>`)
          return null
        }
        return decodeAff(aff)
      })
      .reduce(
        (prev: stencila.Organization[], curr) =>
          curr ? [...prev, curr] : prev,
        []
      )
  }

  return person
}

function encodeAuthor(
  author: stencila.Person | stencila.Organization
): {
  auth: xml.Element
  affs: xml.Element[]
} {
  let name: xml.Element
  let affs: xml.Element[] = []
  if (author.type === 'Person') {
    name = encodeName(author)
    if (author.affiliations) {
      affs = author.affiliations.map(org => {
        return elem(
          'aff',
          { id: 'unique' },
          elem('institution', org.name || '')
        )
      })
    }
  } else {
    name = elem('string-name', author.legalName || author.name || '')
  }

  const affRefs = affs.map(aff =>
    elem('xref', {
      'ref-type': 'aff',
      rid: aff.attributes && aff.attributes.id
    })
  )
  const auth = elem('contrib', { 'contrib-type': 'author' }, name, ...affRefs)

  return { auth, affs }
}

function decodeName(name: xml.Element): stencila.Person {
  return stencila.person({
    givenNames: splitTextOrUndefined(child(name, 'given-names'), /\s+/),
    familyNames: splitTextOrUndefined(child(name, 'surname'), /\s+/),
    honorificPrefix: textOrUndefined(child(name, 'prefix')),
    honorificSuffix: textOrUndefined(child(name, 'suffix'))
  })
}

function encodeName(person: stencila.Person): xml.Element {
  if (person.familyNames || person.givenNames) {
    return elem(
      'name',
      person.familyNames ? elem('surname', person.familyNames.join(' ')) : null,
      person.givenNames
        ? elem('given-names', person.givenNames.join(' '))
        : null,
      person.honorificPrefix ? elem('prefix', person.honorificPrefix) : null,
      person.honorificSuffix ? elem('suffix', person.honorificSuffix) : null
    )
  } else {
    return elem('string-name', person.name || '')
  }
}

function decodeAff(aff: xml.Element): stencila.Organization {
  const addressComponents = all(aff, [
    'city',
    'state',
    'country',
    'postal-code'
  ])
  return stencila.organization({
    name: textOrUndefined(child(aff, 'institution')),
    address: addressComponents.length
      ? addressComponents.map(text).join(', ')
      : undefined
  })
}

function decodeRefList(elem: xml.Element): stencila.CreativeWork[] {
  const refs = all(elem, 'ref')
  return refs
    .map(ref => {
      const citation = child(ref, ['element-citation', 'mixed-citation'])
      return citation ? decodeReference(citation) : null
    })
    .reduce(
      (prev: stencila.CreativeWork[], curr) => (curr ? [...prev, curr] : prev),
      []
    )
}

function encodeReferences(
  references: (stencila.CreativeWork | string)[]
): xml.Element {
  return elem(
    'ref-list',
    elem('title', 'References'),
    ...references.map(encodeReference)
  )
}

function decodeReference(elem: xml.Element): stencila.CreativeWork {
  const rawAuthors = all(elem, 'name')
  const authors = rawAuthors.length ? rawAuthors.map(decodeName) : []

  const work = stencila.article(authors, text(child(elem, 'article-title')))

  const year = child(elem, 'year')
  if (year) {
    const iso = attr(year, 'iso-8601-date')
    work.datePublished = iso || text(year)
    // TODO: warn that the date components apart from year are lost?
    // Or also parse month and day
  }

  const source = child(elem, 'source')
  if (source) {
    const issueEl = child(elem, 'issue')

    if (issueEl) {
      work.isPartOf = stencila.publicationIssue({
        issueNumber: intOrUndefined(child(elem, 'issue')),
        pageStart: intOrUndefined(child(elem, 'fpage')),
        pageEnd: intOrUndefined(child(elem, 'lpage')),
        isPartOf: stencila.publicationVolume({
          title: text(source),
          volumeNumber: intOrUndefined(child(elem, 'volume'))
        })
      })
    } else {
      work.isPartOf = stencila.publicationVolume({
        pageStart: intOrUndefined(child(elem, 'fpage')),
        pageEnd: intOrUndefined(child(elem, 'lpage')),
        title: text(source),
        volumeNumber: intOrUndefined(child(elem, 'volume'))
      })
    }
  }
  return work
}

function encodeReference(work: stencila.CreativeWork | string): xml.Element {
  let citation
  if (typeof work === 'string') {
  } else {
    const subElements = []

    if (work.title) subElements.push(elem('article-title', work.title))

    // TODO: split date into components according to what data is set and apply to appropriate elements
    if (work.datePublished)
      subElements.push(
        elem(
          'year',
          { 'iso-8601-date': work.datePublished },
          work.datePublished
        )
      )

    if (isType('PublicationIssue')(work.isPartOf)) {
      let pi = work.isPartOf as stencila.PublicationIssue

      if (pi.pageStart !== undefined)
        subElements.push(elem('fpage', `${pi.pageStart}`))

      if (pi.pageEnd !== undefined)
        subElements.push(elem('lpage', `${pi.pageEnd}`))

      if (pi.issueNumber !== undefined)
        subElements.push(elem('issue', `${pi.issueNumber}`))

      if (isType('PublicationVolume')(pi.isPartOf)) {
        let pv = pi.isPartOf

        if (pv.title !== undefined) subElements.push(elem('source', pv.title))

        if (pv.volumeNumber !== undefined)
          subElements.push(elem('volume', `${pv.volumeNumber}`))
      }
    } else if (isType('PublicationVolume')(work.isPartOf)) {
      let pv = work.isPartOf as stencila.PublicationVolume

      if (pv.title !== undefined) subElements.push(elem('source', pv.title))

      if (pv.pageStart !== undefined)
        subElements.push(elem('fpage', `${pv.pageStart}`))

      if (pv.pageEnd !== undefined)
        subElements.push(elem('lpage', `${pv.pageEnd}`))

      if (pv.volumeNumber !== undefined)
        subElements.push(elem('volume', `${pv.volumeNumber}`))
    }

    citation = elem('element-citation', null, ...subElements)
  }
  return elem('ref', citation)
}

interface DecodeState {
  /**
   * The id of the current section. Used for setting the
   * id of headings.
   */
  sectionId: string

  /**
   * The depth of the current section. Used for setting the depth
   * of headings.
   */
  sectionDepth: number
}

interface EncodeState {
  /**
   * The current number of tables in the article.
   * Used for labelling tables.
   */
  tables: number
}

/**
 * Decode the JATS `<body>` element to an array of Stencila `Node`s
 */
function decodeBody(elem: xml.Element): stencila.Node[] {
  return decodeDefault(elem, { sectionId: '', sectionDepth: 0 })
}

/**
 * Encode an array of Stencila `Node`s to a JATS `<body>` element
 */
function encodeBody(nodes: stencila.Node[]): xml.Element {
  const state = {
    tables: 0
  }
  const sections: xml.Element[] = []
  let section: xml.Element | undefined
  for (const node of nodes) {
    if (nodeType(node) === 'Heading') {
      section = elem('sec')
      sections.push(section)
    }
    const el = encodeNode(node, state)
    if (!section) {
      section = elem('sec')
      sections.push(section)
    }
    if (section.elements) section.elements.push(...el)
  }
  return elem('body', ...sections)
}

/**
 * Decode a JATS element to an array of Stencila `Node`s
 */
function decodeElement(elem: xml.Element, state: DecodeState): stencila.Node[] {
  switch (elem.name) {
    case 'sec':
      return decodeSection(elem, state)
    case 'title':
      return decodeHeading(elem, state)
    case 'p':
      return decodeParagraph(elem, state)
    case 'list':
      return decodeList(elem, state)
    case 'table-wrap':
      return decodeTableWrap(elem, state)
    case 'ext-link':
      return decodeExtLink(elem, state)
    case 'inline-graphic':
      return decodeInlineGraphic(elem)
    case 'xref':
      return decodeXRef(elem, state)
    case 'italic':
      return decodeMark(elem, state, 'Emphasis')
    case 'bold':
      return decodeMark(elem, state, 'Strong')
    case 'sup':
      return decodeMark(elem, state, 'Superscript')
    case 'sub':
      return decodeMark(elem, state, 'Subscript')
    case 'mml:math':
      return decodeMath(elem)
    case 'break':
      return decodeBreak()
    default:
      if (elem.type === 'text') {
        return [elem.text || '']
      } else {
        log.warn(`Using default decoding for JATS element name: "${elem.name}"`)
        return decodeDefault(elem, state)
      }
  }
}

function encodeNode(node: stencila.Node, state: EncodeState): xml.Element[] {
  switch (nodeType(node)) {
    case 'Heading':
      return encodeHeading(node as stencila.Heading, state)
    case 'Paragraph':
      return encodeParagraph(node as stencila.Paragraph, state)
    case 'List':
      return encodeList(node as stencila.List, state)
    case 'Table':
      return encodeTable(node as stencila.Table, state)
    case 'Link':
      return encodeLink(node as stencila.Link, state)
    case 'Emphasis':
      return encodeMark(node as stencila.Emphasis, state, 'italic')
    case 'Strong':
      return encodeMark(node as stencila.Strong, state, 'bold')
    case 'Superscript':
      return encodeMark(node as stencila.Superscript, state, 'sup')
    case 'Subscript':
      return encodeMark(node as stencila.Subscript, state, 'sub')
    case 'string':
      return [{ type: 'text', text: node as string }]
    default:
      log.warn(`Unhandled node type when encoding to JATS: "${nodeType(node)}"`)
      return []
  }
}

/**
 * Decode the child elements of a JATS element to an array of Stencila `Node`s
 */
function decodeDefault(elem: xml.Element, state: DecodeState): stencila.Node[] {
  return elem.elements
    ? elem.elements
        .map(child => decodeElement(child, state))
        .reduce((prev, curr) => [...prev, ...curr], [])
    : []
}

function decodeElements(
  elems: xml.Element[],
  state: DecodeState
): stencila.Node[] {
  return elems
    .map(child => decodeElement(child, state))
    .reduce((prev, curr) => [...prev, ...curr], [])
}

function decodeInlineContent(
  elems: xml.Element[],
  state: DecodeState
): stencila.InlineContent[] {
  return decodeElements(elems, state).filter(isInlineContent)
}

/**
 * Encode a Stencila `Node`s as a JATS elements
 */
function encodeDefault(
  name: string,
  nodes: stencila.Node[],
  state: EncodeState
): xml.Element {
  const elems = nodes
    .map(node => encodeNode(node, state))
    .reduce((prev, curr) => [...prev, ...curr], [])
  return elem(name, ...elems)
}

function encodeNodes(
  nodes: stencila.Node[],
  state: EncodeState
): xml.Element[] {
  return nodes
    .map(node => encodeNode(node, state))
    .reduce((prev, curr) => [...prev, ...curr], [])
}

/**
 * Decode a JATS `<section>` element.
 *
 * This increments the `sectionId` and `sectionDepth` state variables
 * so that they can be applied to heading nodes (decoded from `<title>` elements).
 * It is necessary to retain `id` attributes so that any internal links are maintained.
 */
function decodeSection(elem: xml.Element, state: DecodeState): stencila.Node[] {
  const sectionId = attr(elem, 'id') || ''
  const sectionDepth = state.sectionDepth + 1
  return decodeDefault(elem, { sectionId, sectionDepth })
}

function decodeHeading(
  elem: xml.Element,
  state: DecodeState
): [stencila.Heading] {
  return [
    stencila.heading(
      decodeInlineContent(elem.elements || [], state),
      state.sectionDepth,
      {
        id: state.sectionId
      }
    )
  ]
}

function encodeHeading(
  node: stencila.Heading,
  state: EncodeState
): [xml.Element] {
  return [encodeDefault('title', node.content, state)]
}

function decodeParagraph(
  elem: xml.Element,
  state: DecodeState
): stencila.Node[] {
  const nodes = decodeElements(elem.elements || [], state)

  const para = stencila.paragraph([])

  const blocks: stencila.Node[] = [para]
  for (const node of nodes) {
    if (isInlineContent(node)) {
      para.content.push(node)
    } else {
      blocks.push(node)
    }
  }
  return blocks
}

function encodeParagraph(
  node: stencila.Paragraph,
  state: EncodeState
): [xml.Element] {
  return [encodeDefault('p', node.content, state)]
}

function decodeExtLink(elem: xml.Element, state: DecodeState): [stencila.Link] {
  return [
    stencila.link(
      decodeInlineContent(elem.elements || [], state),
      attr(elem, 'xlink:href') || ''
    )
  ]
}

/**
 * Decode a JATS `<xref>` element to a Stencila `Link` node.
 *
 * The `rid` attribute is decoded to a local link.
 * The `ref-type` attribute is preserved in the link's `relation` property.
 * See https://jats.nlm.nih.gov/archiving/tag-library/1.1/element/xref.html
 */
function decodeXRef(elem: xml.Element, state: DecodeState): [stencila.Link] {
  const link = stencila.link(
    decodeDefault(elem, state).filter(isInlineContent),
    `#${attr(elem, 'rid') || ''}`
  )

  const refType = attr(elem, 'ref-type')
  if (refType) link.relation = refType

  return [link]
}

function encodeLink(node: stencila.Link, state: EncodeState): [xml.Element] {
  return [
    elem(
      'ext-link',
      {
        'ext-link-type': 'uri',
        'xlink:href': node.target
      },
      ...encodeNodes(node.content, state)
    )
  ]
}

function decodeMark<Type extends keyof typeof markTypes>(
  elem: xml.Element,
  state: DecodeState,
  type: Type
): stencila.Mark[] {
  return [
    {
      type: type,
      content: decodeInlineContent(elem.elements || [], state)
    }
  ]
}

/**
 * Encode a Stencila `Mark` node to a JATS element.
 */
function encodeMark(
  node: stencila.Mark,
  state: EncodeState,
  name: string
): [xml.Element] {
  return [elem(name, ...encodeNodes(node.content, state))]
}

function decodeList(elem: xml.Element, state: DecodeState): [stencila.List] {
  const type = attr(elem, 'list-type')
  const order =
    type === 'bullet' || type === 'simple' ? 'unordered' : 'ascending'
  const items = all(elem, 'list-item').map(
    (item): stencila.ListItem => {
      return {
        type: 'ListItem',
        content: decodeElements(item.elements || [], state)
      }
    }
  )
  return [
    {
      type: 'List',
      order,
      items
    }
  ]
}

function encodeList(node: stencila.List, state: EncodeState): [xml.Element] {
  const attrs = {
    'list-type': node.order === 'unordered' ? 'bullet' : 'order'
  }
  const items = node.items.map(item => {
    return elem('list-item', ...encodeNodes(item.content, state))
  })
  return [elem('list', attrs, ...items)]
}

function decodeTableWrap(
  elem: xml.Element,
  state: DecodeState
): [stencila.Table] {
  const table: stencila.Table = { type: 'Table', rows: [] }

  const id = attr(elem, 'id')
  if (id) table.id = id

  const caption = child(elem, 'caption')
  if (caption) {
    const title = child(caption, 'title')
    if (title) table.title = text(title)

    const content = caption.elements
      ? caption.elements.filter(child => child !== title)
      : []
    if (content) table.content = content
  }

  const rows = all(elem, 'tr')
  if (rows.length) {
    table.rows = rows.map(row => {
      return {
        type: 'TableRow',
        cells: all(row, ['td', 'th']).map(cell => {
          return {
            type: 'TableCell',
            content: decodeInlineContent(cell.elements || [], state)
          }
        })
      }
    })
  }

  return [table]
}

function encodeTable(node: stencila.Table, state: EncodeState): [xml.Element] {
  state.tables += 1

  const attrs = node.id ? { id: node.id } : {}

  const label = elem('label', `Table ${state.tables}.`)

  const caption = elem('caption', node.title ? elem('title', node.title) : null)

  const rows = node.rows.map(row => {
    return elem(
      'tr',
      ...row.cells.map(cell => {
        return encodeDefault('tr', cell.content, state)
      })
    )
  })

  const table = elem('table', elem('tbody', ...rows))

  return [elem('table-wrap', attrs, label, caption, table)]
}

function decodeMath(elem: xml.Element): [object] {
  return [
    {
      type: 'Math',
      language: 'MathML',
      text: xml.dump(elem)
    }
  ]
}

/**
 * Decode a JATS `<break>` element into a space.
 *
 * The `break` element is "An explicit line break in the text."
 * At present, this is assumed not to imply any semantic meaning
 * as is decoded to a space.
 */
function decodeBreak(): [string] {
  return [' ']
}

function decodeInlineGraphic(elem: xml.Element): [stencila.ImageObject] {
  return [
    {
      type: 'ImageObject',
      contentUrl: attr(elem, 'xlink:href') || ''
    }
  ]
}
