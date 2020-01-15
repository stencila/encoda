/**
 * @module csl
 */

import * as stencila from '@stencila/schema'
// @ts-ignore
import Cite from 'citation-js'
import crypto from 'crypto'
import Csl from 'csl-json'
import path from 'path'
import { load } from '../..'
import { logErrorNodeType, logWarnLoss, logWarnLossIfAny } from '../../log'
import { stringifyContent } from '../../util/content/stringifyContent'
import * as vfile from '../../util/vfile'
import { Codec, GlobalEncodeOptions } from '../types'

/**
 * The directory where styles are stored
 */
export const stylesDir = path.join(__dirname, 'styles')

interface DecodeOptions {
  format: string
}

export class CSLCodec extends Codec<{}, DecodeOptions>
  implements Codec<{}, DecodeOptions> {
  public readonly mediaTypes = ['application/vnd.citationstyles.csl+json']

  public readonly extNames = ['csl']

  /**
   * Parse CSL-JSON or other bibliographic format to a `Node`
   */
  public readonly decode = async (
    file: vfile.VFile,
    options = { format: '@csl/object' }
  ): Promise<stencila.Node> => {
    const content: string = await vfile.dump(file)

    let csls
    try {
      csls = await Cite.inputAsync(content, { forceType: options.format })
    } catch (error) {
      throw new Error(
        `Error when parsing content of format ${options.format}: ${error.message}`
      )
    }

    // TODO: work out what to return when more than one work e.g. a bibtex file
    const csl = csls[0]

    return decodeCsl(csl)
  }

  /**
   * Encode a `Node` to CSL-JSON or other bibliographic format
   *
   * See https://citation.js.org/api/tutorial-output_options.html
   * for formats and other options which could be used.
   */
  public readonly encode = (
    node: stencila.Node,
    options: GlobalEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    const { format = 'json' } = options

    let content = ''
    if (stencila.isCreativeWork(node)) {
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

    return Promise.resolve(vfile.load(content))
  }
}

/**
 * Decode `Csl.Data` to a `CreativeWork` or derived type.
 */
export async function decodeCsl(
  csl: Csl.Data
): Promise<stencila.CreativeWork | stencila.Article> {
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
      isPartOf = stencila.periodical({
        title: containerTitle
      })
      if (volume !== undefined) {
        isPartOf = stencila.publicationVolume({
          volumeNumber: volume,
          isPartOf
        })
      }
      if (issue !== undefined) {
        isPartOf = stencila.publicationIssue({
          issueNumber: issue,
          isPartOf
        })
      }
    }

    return stencila.article(authors, title, {
      id,
      datePublished,
      isPartOf
    })
  } else {
    logWarnLoss('csl', 'decode', `Unhandled citation type ${csl.type}`)
    return stencila.creativeWork()
  }
}

/**
 * Encode a `CreativeWork` as `Csl.Data`
 */
export const encodeCsl = (cw: stencila.CreativeWork): Csl.Data => {
  const {
    id,
    title = 'Untitled',
    authors = [],
    datePublished,
    dateCreated,
    dateModified,
    isPartOf,
    ...lost
  } = cw
  logWarnLossIfAny('csl', 'encode', cw, lost)

  const date = datePublished || dateModified || dateCreated || undefined

  return {
    type: 'article-journal',
    id: id !== undefined ? id : crypto.randomBytes(16).toString('hex'),
    title: stringifyContent(title),
    author: authors.map(encodeAuthor),
    issued: date !== undefined ? encodeDate(date) : undefined,
    ...encodeIsPartOf(isPartOf)
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
const decodeAuthor = (author: Csl.Person): Promise<stencila.Person> => {
  const { family, given, suffix, literal, ...lost } = author
  logWarnLossIfAny('csl', 'decode', author, lost)

  if (family === undefined && literal !== undefined) {
    return load(literal, 'person') as Promise<stencila.Person>
  }

  return Promise.resolve(
    stencila.person({
      familyNames: family !== undefined ? [family] : undefined,
      givenNames: given !== undefined ? [given] : undefined,
      honorificSuffix: suffix
    })
  )
}

/**
 * Encode an author as a `Csl.Person`
 */
const encodeAuthor = (
  author: stencila.Person | stencila.Organization
): Csl.Person => {
  return stencila.isA('Person', author)
    ? encodePerson(author)
    : encodeOrganization(author)
}

/**
 * Encode a `Person` as a `Csl.Person`
 */
const encodePerson = (person: stencila.Person): Csl.Person => {
  const { givenNames = [], familyNames = [], honorificSuffix, ...rest } = person
  logWarnLossIfAny('csl', 'encode', person, rest)

  return {
    given: givenNames.join(' '),
    family: familyNames.join(' '),
    suffix: honorificSuffix
  }
}

/**
 * Encode an `Organization` as a `Csl.Person`
 *
 * CSL-JSON does not allow for an org author so we use the `literal` property
 * to encode the org name.
 */
const encodeOrganization = (org: stencila.Organization): Csl.Person => {
  const { name = 'Anonymous' } = org
  logWarnLoss('csl', 'encode', 'Does not support organizations as authors')

  return {
    literal: name
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
const encodeDate = (date: stencila.Date | string): Csl.Date => {
  const iso = stencila.isA('Date', date) ? date.value : date
  const obj = new Date(iso + ' UTC')
  return {
    'date-parts': [[obj.getFullYear(), obj.getMonth(), obj.getDate()]]
  }
}

/**
 * Encode the `isPartOf` property of a `CreativeWork` into properties of
 * a `Csl.Data` object.
 */
const encodeIsPartOf = (cw: stencila.CreativeWork['isPartOf']): object => {
  if (cw === undefined) return {}

  if (stencila.isA('PublicationVolume', cw)) {
    const { title, volumeNumber: volume, pageStart, pageEnd, ...lost } = cw
    logWarnLossIfAny('csl', 'encode', cw, lost)

    let page = ''
    if (pageStart) page += pageStart
    if (pageEnd) page += `-${pageEnd}`

    return {
      'container-title': title,
      page
    }
  } else {
    logWarnLoss(
      'csl',
      'encode',
      `Unhandled isPartOf type: ${stencila.nodeType(cw)}`
    )
    return {}
  }
}
