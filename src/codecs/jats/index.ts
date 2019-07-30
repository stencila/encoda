/**
 * @module jats
 */

import { getLogger } from '@stencila/logga';
import stencila from '@stencila/schema';
import { isInlineContent } from '@stencila/schema/dist/util';
import fs from 'fs-extra';
import { Encode } from '../..';
import * as vfile from '../../util/vfile';
/* eslint-disable import/no-duplicates */
import * as xml from '../../util/xml';
import { all, attr, child, elem, first, text } from '../../util/xml';

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
  const jats = xml.dump(doc, { spaces: 2 })
  return vfile.load(jats)
}

function decodeDocument(doc: xml.Element): stencila.Node {
  const article = first(doc, 'article')
  return article ? decodeArticle(article) : null
}

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
  const title = first(front, 'article-title')
  const authors = all(front, 'contrib', { 'contrib-type': 'author' })

  const article: stencila.Article = {
    type: 'Article',
    title: title ? decodeTitle(title) : '',
    authors: authors.length ? decodeAuthors(authors, elem) : []
  }

  const body = child(elem, 'body')
  if (body) article.content = decodeBody(body)

  const back = child(elem, 'back')
  const refList = first(back, 'ref-list')
  if (refList) article.citations = decodeRefList(refList)

  return article
}

function encodeArticle(article: stencila.Article): xml.Element {
  const front = elem(
    'front',
    encodeTitle(article.title || ''),
    encodeAuthors(article.authors || [])
  )
  const body = elem('body')
  const back = elem('back')
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

function decodeTitle(title: xml.Element): string {
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
  const person: stencila.Person = { type: 'Person' }
  const givenNames = child(name, 'given-names')
  if (givenNames) person.givenNames = text(givenNames).split(/\s+/)
  const surname = child(name, 'surname')
  if (surname) person.familyNames = text(surname).split(/\s+/)
  const prefix = child(name, 'prefix')
  if (prefix) person.honorificPrefix = text(prefix)
  const suffix = child(name, 'suffix')
  if (suffix) person.honorificSuffix = text(suffix)
  return person
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
      person.honorificSuffix ? elem('suffic', person.honorificSuffix) : null
    )
  } else {
    return elem('string-name', person.name || '')
  }
}

function decodeAff(aff: xml.Element): stencila.Organization {
  const org: stencila.Organization = { type: 'Organization' }

  const institution = child(aff, 'institution')
  if (institution) org.name = text(institution)

  const address = all(aff, ['city', 'state', 'country', 'postal-code'])
  if (address.length) org.address = address.map(text).join(', ')

  return org
}

function decodeRefList(elem: xml.Element): stencila.CreativeWork[] {
  const refs = all(elem, 'ref')
  return refs
    .map(ref => {
      const citation = child(ref, ['element-citation', 'mixed-citation'])
      return citation ? decodeCitation(citation) : null
    })
    .reduce(
      (prev: stencila.CreativeWork[], curr) => (curr ? [...prev, curr] : prev),
      []
    )
}

function decodeCitation(elem: xml.Element): stencila.CreativeWork {
  const work: stencila.CreativeWork = { type: 'CreativeWork' }

  const title = child(elem, 'article-title')
  if (title) work.title = text(title)

  const year = child(elem, 'year')
  if (year) {
    const iso = attr(year, 'iso-8601-date')
    work.datePublished = iso || text(year)
  }

  // TODO: Decode to nested `isPartOf` e.g. https://gist.github.com/hubgit/005ce6b78e4700374bc8#file-scholarly-article-json-L9
  // Requires types that we currently don't have including PublicationIssue and PublicationVolume
  const source = child(elem, 'source')
  if (source) {
    work.isPartOf = {
      type: 'CreativeWork',
      name: text(source)
    }
  }

  const authors = all(elem, 'name')
  if (authors.length) work.authors = authors.map(decodeName)

  return work
}

interface DecodeState {
  depth: number
}

function decodeBody(elem: xml.Element): stencila.Node[] {
  return decodeElement(elem, { depth: 0 })
}

function decodeElement(elem: xml.Element, state: DecodeState): stencila.Node[] {
  if (elem.type === 'text') return [elem.text || '']

  switch (elem.name) {
    case 'sec':
      return decodeSection(elem, state)
    case 'title':
      return decodeHeading(elem, state)
    case 'p':
      return decodeParagraph(elem, state)
    case 'table-wrap':
      return decodeTableWrap(elem, state)
    default:
      return decodeChildren(elem, state)
  }
}

function decodeSection(elem: xml.Element, state: DecodeState): stencila.Node[] {
  return decodeChildren(elem, { depth: state.depth + 1 })
}

function decodeHeading(
  elem: xml.Element,
  state: DecodeState
): [stencila.Heading] {
  return [
    {
      type: 'Heading',
      depth: state.depth,
      content: decodeChildren(elem, state).filter(isInlineContent)
    }
  ]
}

function decodeParagraph(
  elem: xml.Element,
  state: DecodeState
): [stencila.Paragraph] {
  return [
    {
      type: 'Paragraph',
      content: decodeChildren(elem, state).filter(isInlineContent)
    }
  ]
}

function decodeTableWrap(
  elem: xml.Element,
  state: DecodeState
): [stencila.Table] {
  const table: stencila.Table = { type: 'Table', rows: [] }

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
            content: decodeElement(cell, state).filter(isInlineContent)
          }
        })
      }
    })
  }

  return [table]
}

function decodeChildren(
  elem: xml.Element,
  state: DecodeState
): stencila.Node[] {
  return elem.elements
    ? elem.elements
        .map(child => decodeElement(child, state))
        .reduce((prev, curr) => [...prev, ...curr])
    : []
}
