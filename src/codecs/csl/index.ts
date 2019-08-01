/**
 * Codec for CSL JSON
 *
 * Also acts a base codec for other bibliographic formats
 * e.g. BibTeX. Based on https://citation.js.org/
 */

import * as stencila from '@stencila/schema'
import { isA, isCreativeWork } from '@stencila/schema/dist/util';
// @ts-ignore
import Cite from 'citation-js';
import Csl from 'csl-json';
import { Encode, EncodeOptions, load } from '../..';
import * as vfile from '../../util/vfile';
import { errorNodeType, warnLossIfAny, warnLoss } from '../../log';

export const mediaTypes = ['application/vnd.citationstyles.csl+json']

export const extNames = ['csl']

/**
 * Parse CSL-JSON or other bibliographic format to a `Node`
 */
export async function decode(
  file: vfile.VFile,
  format: string = '@csl/object'
): Promise<stencila.Node> {
  const content: string = await vfile.dump(file)

  let csls
  try {
    csls = await Cite.inputAsync(content, { forceType: format })
  } catch (error) {
    throw new Error(
      `Error when parsing content of format ${format}: ${error.message}`
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
export const encode: Encode = async (
  node: stencila.Node,
  options: EncodeOptions = {}
): Promise<vfile.VFile> => {
  const { format = 'json' } = options

  let content = ''
  if (isCreativeWork(node)) {
    const csl = encodeCsl(node)
    const cite = new Cite([csl])
    if (format == 'json') {
      const {_graph, ...rest} = cite.data[0]
      content = JSON.stringify(rest, null, 2)
    } else {
      content = cite.format(format, options)
    }
  } else {
    errorNodeType('csl', 'encode', 'CreativeWork', node)
  }

  return vfile.load(content)
}

/**
 * Decode `Csl.Data` to a `CreativeWork` or derived type.
 */
async function decodeCsl(csl: Csl.Data): Promise<stencila.CreativeWork | stencila.Article> {
  const {
    type,
    id,
    author = [],
    title = '',
    ...lost
  } = csl

  if (type === 'article-journal') {
    warnLossIfAny('csl', 'decode', csl, lost)
    return stencila.article(
      await Promise.all(author.map(decodeAuthor)),
      title,
      {
        id
      }
    )
  } else {
    warnLoss('csl', 'decode', `Unhandled citation type ${csl.type}`)
    return stencila.creativeWork()
  }
}

/**
 * Encode a `CreativeWork` as `Csl.Data`
 */
const encodeCsl = (cw: stencila.CreativeWork): Csl.Data => {
  const {
    title = 'Untitled',
    authors = [],
    ...lost
  } = cw

  warnLossIfAny('csl', 'encode', cw, lost)
  return {
    type: 'article-journal',
    id: 'id',// TODO id is required
    title: title,
    author: authors.map(encodeAuthor)
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
const decodeAuthor = async (author: Csl.Person): Promise<stencila.Person> => {
  let {
    family,
    given,
    suffix,
    literal,
    ...lost
  } = author

  if (family === undefined && literal !== undefined) {
    return load(literal, 'person') as Promise<stencila.Person>
  }

  warnLossIfAny('csl', 'decode', author, lost)
  return stencila.person({
    familyNames: family !== undefined ? [family] : undefined,
    givenNames: given !== undefined ? [given] : undefined,
    honorificSuffix: suffix
  })
}

/**
 * Encode an author as a `Csl.Person`
 */
const encodeAuthor = (author: stencila.Person | stencila.Organization): Csl.Person => {
  return isA('Person', author) ? encodePerson(author) : encodeOrganization(author)
}

/**
 * Encode a `Person` as a `Csl.Person`
 */
const encodePerson = (person: stencila.Person): Csl.Person => {
  const {
    givenNames = [],
    familyNames = [],
    honorificSuffix,
    ...rest
  } = person

  warnLossIfAny('csl', 'encode', person, rest)
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
  const {
    name = 'Anonymous'
  } = org

  warnLoss('csl', 'encode', 'Does not support organizations as authors')
  return {
    literal: name
  }
}
