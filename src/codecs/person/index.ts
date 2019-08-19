/**
 * @module person
 */

import * as stencila from '@stencila/schema'
// @ts-ignore
import parseAuthor from 'parse-author'
// @ts-ignore
import { parseFullName } from 'parse-full-name'
import log from '../../log'
import * as vfile from '../../util/vfile'
import { OrcidCodec } from '../orcid'
import { Codec } from '../types'

export class PersonCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-person']

  public readonly extNames = ['person']

  public static regex = /^\s*[A-Z][a-z.]*(\s+[A-Z][a-z.]*)+(\s+<[\w-_@.]+>)?\s*$/

  public readonly sniff = async (content: string): Promise<boolean> => {
    return PersonCodec.regex.test(content)
  }

  /**
   * Decode a `VFile` with string content to a `Person`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `Node`
   */
  public readonly decode = async (
    file: vfile.VFile | string
  ): Promise<stencila.Person> => {
    const content = typeof file === 'string' ? file : await vfile.dump(file)

    // If there appears to be an ORCID, use that.
    // Use the `OrcidCodec` regex but remove the start and end anchors to match
    // an ORCID anywhere in the string
    const match = content.match(OrcidCodec.regex.source.slice(1, -1))
    if (match) {
      try {
        const orcid = new OrcidCodec()
        const person = await orcid.decode(match[0])
        // ORCID decoding is only deemed successful if returns
        // a person with a least one family name
        if (stencila.isA('Person', person))
          if (person.familyNames !== undefined && person.familyNames.length > 0)
            return person
      } catch (error) {
        // Log a warning (e.g. due to no network connection) but continue
        log.warn(`Error attempting to decode ORCID: ${error.message}`)
      }
    }

    // If not, parse string into parts
    const { name, email, url } = parseAuthor(content)
    const { title, first, middle, last, suffix } = parseFullName(name)
    return stencila.person({
      givenNames:
        first.length > 0
          ? [first, ...(middle.length > 0 ? [middle] : [])]
          : undefined,
      familyNames: last.length > 0 ? [last] : undefined,
      honorificPrefix: title.length > 0 ? title : undefined,
      honorificSuffix: suffix.length > 0 ? suffix : undefined,
      emails: email !== undefined ? [email] : undefined,
      url: url
    })
  }

  /**
   * Encode a `Person` to a `VFile`.
   *
   * @param node The `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    let content = ''

    if (stencila.isA('Person', node)) {
      if (node.honorificPrefix) content += node.honorificPrefix
      if (node.givenNames) content += ' ' + node.givenNames.join(' ')
      if (node.familyNames) content += ' ' + node.familyNames.join(' ')
      if (node.honorificSuffix) content += ' ' + node.honorificSuffix
      if (node.emails && node.emails[0]) content += ` <${node.emails[0]}>`
      if (node.url) content += ` (${node.url})`
      content = content.trim()
    } else {
      log.warn(
        `Expected a node of type "Person", got a node of type "${stencila.nodeType(
          node
        )}"`
      )
    }

    return vfile.load(content)
  }
}
