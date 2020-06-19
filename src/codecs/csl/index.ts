/**
 * @module csl
 */

import * as schema from '@stencila/schema'
// @ts-ignore
import Cite from 'citation-js'
import crypto from 'crypto'
import Csl from 'csl-json'
import path from 'path'
import { load } from '../..'
import { logErrorNodeType, logWarnLoss, logWarnLossIfAny } from '../../log'
import { TxtCodec } from '../txt'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions, CommonDecodeOptions } from '../types'

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

    const content: string = await vfile.dump(file)

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
        (ns: string, n: schema.Node) => ns + encode(n, format),
        ''
      )
    } else {
      content = encode(node, format)
    }

    return Promise.resolve(vfile.load(content))
  }
}

function encode(node: schema.Node, format: string): string {
  let content = ''
  if (schema.isCreativeWork(node)) {
    const csl = encodeCsl(node)
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

    issued,

    'container-title': containerTitle,
    volume,
    issue,
    page,

    // @ts-ignore // Citation.js uses this hidden property
    _graph,

    ...lost
  } = csl

  if (type === 'article-journal') {
    logWarnLossIfAny('csl', 'decode', csl, lost)

    const authors = await Promise.all(author.map(decodeAuthor))

    const datePublished = issued !== undefined ? decodeDate(issued) : undefined

    let isPartOf
    if (containerTitle !== undefined) {
      isPartOf = schema.periodical({
        title: containerTitle,
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

    return schema.article({
      authors,
      title,
      id,
      datePublished,
      isPartOf,
    })
  } else {
    logWarnLoss('csl', 'decode', `Unhandled citation type ${csl.type}`)
    return schema.creativeWork()
  }
}

/**
 * Encode a `CreativeWork` as `Csl.Data`
 */
export const encodeCsl = (work: schema.CreativeWork): Csl.Data => {
  if (schema.isArticle(work)) return encodeArticle(work)
  else {
    logWarnLoss(
      'csl',
      'encode',
      `Unhandled creative work type ${schema.nodeType(work)}`
    )
    return encodeCreativeWork(work, 'article')
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
  type: Csl.ItemType
): Csl.Data => {
  const {
    id = crypto.randomBytes(16).toString('hex'),
    title = 'Untitled',
    authors = [],
    datePublished,
    dateCreated,
    dateModified,
    isPartOf,
    ...lost
  } = work
  logWarnLossIfAny('csl', 'encode', work, lost)

  const date = datePublished ?? dateModified ?? dateCreated ?? undefined

  return {
    type,
    id,
    'citation-label': id,
    title: TxtCodec.stringify(title),
    author: authors.map(encodeAuthor),
    issued: date !== undefined ? encodeDate(date) : undefined,
    ...encodeIsPartOf(isPartOf),
  }
}

/**
 * Encode an `Article` as `Csl.Data`
 */
export const encodeArticle = (article: schema.Article): Csl.Data => {
  const { pageStart, pageEnd, pagination, ...rest } = article

  let page
  if (pagination !== undefined) page = pagination
  else if (pageStart !== undefined) {
    page = `${pageStart}`
    if (pageEnd !== undefined) page += `-${pageEnd}`
  }

  return {
    ...encodeCreativeWork(rest, 'article-journal'),
    page,
  }
}

/**
 * Decode a `Csl.Person` as a `Person`
 *
 * If `family` is not defined but `literal` is then the
 * `person` codec is used to decode the literal string.
 *
 * CSL-JSON's `non-dropping-particle` and `dropping-particle`
 * are not currently supported in `Person`.
 */
const decodeAuthor = (author: Csl.Person): Promise<schema.Person> => {
  const { family, given, suffix, literal, ...lost } = author
  logWarnLossIfAny('csl', 'decode', author, lost)

  if (family === undefined && literal !== undefined) {
    return load(literal, 'person') as Promise<schema.Person>
  }

  return Promise.resolve(
    schema.person({
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
  author: schema.Person | schema.Organization
): Csl.Person => {
  return schema.isA('Person', author)
    ? encodePerson(author)
    : encodeOrganization(author)
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
const encodeOrganization = (org: schema.Organization): Csl.Person => {
  const { name = 'Anonymous' } = org
  logWarnLoss('csl', 'encode', 'Does not support organizations as authors')

  return {
    literal: name,
  }
}

/**
 * Decode a `Csl.Date` as an ISO date `string`
 */
const decodeDate = (date: Csl.Date): string => {
  const { 'date-parts': dateParts, raw, literal, ...lost } = date
  logWarnLossIfAny('csl', 'decode', date, lost)

  if (dateParts !== undefined) return dateParts.join('-')
  if (raw !== undefined) return new Date(raw).toISOString()
  if (literal !== undefined) return literal

  return ''
}

/**
 * Encode a Stencila `Date` as a `Csl.Date`.
 */
const encodeDate = (date: Date | schema.Date | string): Csl.Date => {
  if (!(date instanceof Date)) {
    const iso = schema.isA('Date', date) ? date.value : date
    date = new Date(iso + ' UTC')
  }
  return {
    'date-parts': [[date.getFullYear(), date.getMonth() + 1, date.getDate()]],
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
  } else if (schema.isA('Periodical', work)) {
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
