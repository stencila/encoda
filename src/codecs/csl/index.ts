/**
 * [[include:src/codecs/csl/README.md]]
 *
 * @module codecs/csl
 */

import * as schema from '@stencila/schema'
// @ts-ignore
import Cite from 'citation-js'
import crypto from 'crypto'
import Csl from 'csl-json'
import path from 'path'
import {
  logErrorNodeType,
  logWarnLoss,
  logWarnLossIfAny,
} from '../../util/logging'
import * as vfile from '../../util/vfile'
import { TxtCodec } from '../txt'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

/**
 * The directory where styles are stored
 */
export const stylesDir = path.join(__dirname, 'styles')

export class CSLCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/vnd.citationstyles.csl+json']

  public readonly extNames = ['csl']

  /**
   * Decode CSL-JSON, or other bibliographic format, to a `Node`.
   */
  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<schema.Node> => {
    const { format = '@csl/object' } = {
      ...this.commonDecodeDefaults,
      ...options,
    }

    const content = await vfile.dump(file)

    let csls: Csl.Data[]
    try {
      csls = await Cite.inputAsync(content, { forceType: format })
    } catch (error) {
      throw new Error(
        `Error when parsing content of format ${format}: ${error.message}`
      )
    }

    const nodes = []
    for (const data of csls) {
      const node = await decodeCsl(data)
      nodes.push(node)
    }

    return nodes
  }

  /**
   * Encode a `Node` to CSL-JSON or other bibliographic format
   *
   * See https://citation.js.org/api/tutorial-output_options.html
   * for formats and other options which could be used.
   */
  public readonly encode = (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const { format = 'json' } = options

    let content = ''
    if (Array.isArray(node)) {
      content = node.reduce(
        (ns: string, n: schema.Node) => ns + encodeNode(n, format),
        ''
      )
    } else {
      content = encodeNode(node, format)
    }

    return Promise.resolve(vfile.load(content))
  }
}

/**
 * Encode a `Node` to a string of given `format`.
 */
function encodeNode(node: schema.Node, format: string): string {
  let content = ''
  if (typeof node === 'string') {
    // `CreativeWork` references can be strings, so we need to deal with them.
    // This just makes the string the title of a `CreativeWork`
    return encodeNode(schema.creativeWork({ title: node }), format)
  }
  if (schema.isCreativeWork(node)) {
    const csl = encodeCsl(node, format)
    const cite = new Cite([csl])

    if (format === 'json') {
      const { _graph, ...rest } = cite.data[0]
      content = JSON.stringify(rest, null, 2)
    } else {
      content = cite.format(format)
    }
  } else {
    logErrorNodeType('csl', 'encode', 'CreativeWork', node)
  }
  return content
}

/**
 * Decode `Csl.Data` to a `CreativeWork` or derived type.
 */
export async function decodeCsl(
  csl: Csl.Data
): Promise<schema.CreativeWork | schema.Article> {
  const {
    type,
    id,

    author = [],
    title = '',

    submitted,
    issued,

    'container-title': containerTitle,
    volume,
    issue,
    page,

    publisher: publisherName,
    'publisher-place': publisherPlace,

    URL: url,
    DOI: doi,

    // Properties to ignore
    // @ts-ignore this hidden Citation.js property
    _graph,
    // citation-label because it is the same as id (but don't want it in `lost`)
    'citation-label': _citationLabel,

    // ...lost
  } = csl

  // This is noisy, and mainly useful in development, so turn off
  // logWarnLossIfAny('csl', 'decode', csl, lost)

  const authors = await Promise.all(author.map(decodeAuthor))

  const dateReceived =
    submitted !== undefined ? decodeDate(submitted) : undefined
  const datePublished = issued !== undefined ? decodeDate(issued) : undefined

  let isPartOf
  if (containerTitle !== undefined) {
    isPartOf = schema.periodical({
      name: containerTitle,
    })
    if (volume !== undefined) {
      isPartOf = schema.publicationVolume({
        volumeNumber: volume,
        isPartOf,
      })
    }
    if (issue !== undefined) {
      isPartOf = schema.publicationIssue({
        issueNumber: issue,
        isPartOf,
      })
    }
  }

  let pageStart
  let pageEnd
  let pagination
  if (page !== undefined) {
    const match = /\s*(\d+)\s*-\s*(\d+)\s*/.exec(page)
    if (match) {
      pageStart = match[1]
      pageEnd = match[2]
    } else pagination = page
  }

  let publisher: schema.Organization | undefined
  if (publisherName !== undefined) {
    publisher = schema.organization({
      name: publisherName,
      address: publisherPlace,
    })
  }

  let identifiers
  if (doi !== undefined) {
    identifiers = [
      schema.propertyValue({
        name: 'doi',
        propertyID: 'https://registry.identifiers.org/registry/doi',
        value: doi,
      }),
    ]
  }

  const common = {
    authors,
    title,
    id,
    dateReceived,
    datePublished,
    isPartOf,
    publisher,
    identifiers,
    url,
  }

  if (type === 'article-journal') {
    return schema.article({ ...common, pageStart, pageEnd, pagination })
  } else {
    logWarnLoss(
      'csl',
      'decode',
      `Unhandled citation type "${csl.type}", using CreativeWork.`
    )
    return schema.creativeWork(common)
  }
}

/**
 * Encode a `CreativeWork` as `Csl.Data`
 */
export const encodeCsl = (
  work: schema.CreativeWork,
  format: string
): Csl.Data => {
  if (schema.isArticle(work)) return encodeArticle(work, format)
  else {
    logWarnLoss(
      'csl',
      'encode',
      `Unhandled creative work type ${schema.nodeType(work)}`
    )
    return encodeCreativeWork(work, 'article', format)
  }
}

/**
 * Encode a `CreativeWork` as `Csl.Data`.
 *
 * This function is intended as a base for other functions that encode particular
 * types of creative works e.g. `Book`, or as a fallback.
 */
export const encodeCreativeWork = (
  work: schema.CreativeWork,
  type: Csl.ItemType,
  format: string
): Csl.Data => {
  const {
    id = crypto.randomBytes(16).toString('hex'),
    title = 'Untitled',
    authors = [],
    datePublished,
    dateCreated,
    dateModified,
    isPartOf,
    publisher,
    url,
    ...lost
  } = work
  logWarnLossIfAny('csl', 'encode', work, lost)

  const date = datePublished ?? dateModified ?? dateCreated ?? undefined

  return {
    type,
    id,
    'citation-label': id,
    title: TxtCodec.stringify(title),
    author: authors.map((author) => encodeAuthor(author, format)),
    issued: date !== undefined ? encodeDate(date) : undefined,
    URL: url,
    ...encodePublisher(publisher),
    ...encodeIsPartOf(isPartOf),
  }
}

/**
 * Encode an `Article` as `Csl.Data`
 */
export const encodeArticle = (
  article: schema.Article,
  format: string
): Csl.Data => {
  const { pageStart, pageEnd, pagination, ...rest } = article

  let page
  if (pagination !== undefined) page = pagination
  else if (pageStart !== undefined) {
    page = `${pageStart}`
    if (pageEnd !== undefined) page += `-${pageEnd}`
  }

  return {
    ...encodeCreativeWork(rest, 'article-journal', format),
    page,
  }
}

/**
 * Decode a CSL `Person` to a `Person` or `Organization` node.
 *
 * If only `family` is defined then assumes an organizational author.
 * (Citation.js seems to put `literal` names into `family`).
 *
 * CSL-JSON's `non-dropping-particle` and `dropping-particle`
 * are not currently supported in `Person`.
 *
 * Other data that may be provided e.g. `sequence` ("first", "additional")
 * and `ORCID` are currently ignored.
 */
const decodeAuthor = (
  author: Csl.Person
): Promise<schema.Person | schema.Organization> => {
  const { family, given, suffix } = author

  // logWarnLossIfAny('csl', 'decode', author, lost)

  return Promise.resolve(
    family !== undefined && given === undefined
      ? schema.organization({ name: family })
      : schema.person({
          familyNames: family !== undefined ? [family] : undefined,
          givenNames: given !== undefined ? [given] : undefined,
          honorificSuffix: suffix,
        })
  )
}

/**
 * Encode an author as a `Csl.Person`
 */
const encodeAuthor = (
  author: schema.Person | schema.Organization,
  format: string
): Csl.Person => {
  return schema.isA('Person', author)
    ? encodePerson(author)
    : encodeOrganization(author, format)
}

/**
 * Encode a `Person` as a `Csl.Person`
 */
const encodePerson = (person: schema.Person): Csl.Person => {
  const { givenNames = [], familyNames = [], honorificSuffix, ...rest } = person
  logWarnLossIfAny('csl', 'encode', person, rest)

  return {
    given: givenNames.join(' '),
    family: familyNames.join(' '),
    suffix: honorificSuffix,
  }
}

/**
 * Encode an `Organization` as a `Csl.Person`
 *
 * CSL-JSON does not allow for an org author so we use the `literal` property
 * to encode the org name.
 */
const encodeOrganization = (
  org: schema.Organization,
  _format: string
): Csl.Person => {
  const { name = 'Anonymous' } = org
  return { literal: name }
}

/**
 * Encode an `Organization` as a `string` for use as the `publisher` property
 */
const encodePublisher = (
  org?: schema.Organization | schema.Person
): { publisher?: string; 'publisher-place'?: string } | undefined => {
  if (org === undefined) return undefined
  const { name, address } = org
  let place: string | undefined
  if (address !== undefined) {
    if (typeof address === 'string') place = address
    else {
      place = [
        address.addressLocality,
        address.addressRegion,
        address.addressCountry,
      ]
        .filter((item) => item !== undefined)
        .join(', ')
    }
  }
  return {
    publisher: name,
    'publisher-place': place,
  }
}

/**
 * Decode a `Csl.Date` to a Stencila `Date`
 */
const decodeDate = (date: Csl.Date): schema.Date | undefined => {
  const { 'date-parts': dateParts, raw, literal, ...lost } = date
  logWarnLossIfAny('csl', 'decode', date, lost)

  if (dateParts !== undefined)
    return schema.date({ value: dateParts.join('-') })
  if (raw !== undefined)
    return schema.date({ value: new Date(raw).toISOString() })
  if (literal !== undefined) return schema.date({ value: literal })

  return undefined
}

/**
 * Encode a Stencila `Date` as a `Csl.Date`.
 *
 * If the date is 1 January then only encode the year (not
 * the month and day).
 */
const encodeDate = (date: Date | schema.Date | string): Csl.Date => {
  if (!(date instanceof Date)) {
    const iso = schema.isA('Date', date) ? date.value : date
    date = new Date(iso + ' UTC')
  }
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {
    'date-parts': month === 1 && day === 1 ? [[year]] : [[year, month, day]],
  }
}

/**
 * Encode the `isPartOf` property of a `CreativeWork` into properties of
 * a `Csl.Data` object.
 */
const encodeIsPartOf = (
  work: schema.CreativeWork['isPartOf']
): Omit<Csl.Data, 'type' | 'id'> => {
  if (work === undefined) return {}

  if (schema.isA('PublicationIssue', work)) {
    const { name, title, issueNumber, isPartOf, ...lost } = work
    logWarnLossIfAny('csl', 'encode', work, lost)

    return {
      ...(isPartOf !== undefined
        ? encodeIsPartOf(isPartOf)
        : encodeContainerTitle(name, title)),
      issue: issueNumber,
    }
  } else if (schema.isA('PublicationVolume', work)) {
    const { name, title, volumeNumber, isPartOf, ...lost } = work
    logWarnLossIfAny('csl', 'encode', work, lost)

    return {
      ...(isPartOf !== undefined
        ? encodeIsPartOf(isPartOf)
        : encodeContainerTitle(name, title)),
      volume: volumeNumber,
    }
  } else if (
    schema.isA('Periodical', work) ||
    schema.isA('CreativeWork', work)
  ) {
    const { name, title, ...lost } = work
    logWarnLossIfAny('csl', 'encode', work, lost)

    return encodeContainerTitle(name, title)
  } else {
    logWarnLoss(
      'csl',
      'encode',
      `Unhandled isPartOf type: ${schema.nodeType(work)}`
    )
    return {}
  }
}

/**
 * Encode a CSL `container-title` property from the `name` or `title` of a `CreativeWork`.
 */
const encodeContainerTitle = (
  name: schema.CreativeWork['name'],
  title: schema.CreativeWork['title']
): Pick<Csl.Data, 'container-title'> => ({
  'container-title':
    name !== undefined
      ? name
      : title !== undefined
      ? TxtCodec.stringify(title)
      : 'Untitled',
})
