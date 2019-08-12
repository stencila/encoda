/**
 * @module person
 */

import * as stencila from '@stencila/schema'
import { is, nodeType } from '@stencila/schema/dist/util'
// @ts-ignore
import parseAuthor from 'parse-author'
// @ts-ignore
import { parseFullName } from 'parse-full-name'
import log from '../../log'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class PersonCodec extends Codec implements Codec {
  public mediaTypes = ['text/x-person']

  public extNames = ['person']

  public sniff = async (content: string): Promise<boolean> => {
    return /^\s*[A-Z][a-z.]*(\s+[A-Z][a-z.]*)+(\s+<[\w-_@.]+>)?\s*$/.test(
      content
    )
  }

  /**
   * Decode a `VFile` with string content to a `Person`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `Node`
   */
  public decode = async (file: vfile.VFile): Promise<stencila.Person> => {
    return this.decodeSync(await vfile.dump(file))
  }

  /**
   * Decode string data into a `Person`.
   *
   * @param data Data to decode
   */
  public decodeSync = (data: string): stencila.Person => {
    const { name, email, url } = parseAuthor(data)
    const { title, first, middle, last, suffix } = parseFullName(name)
    const person: stencila.Person = { type: 'Person' }
    if (title) person.honorificPrefix = title
    if (first) {
      person.givenNames = [first]
      if (middle) person.givenNames = [first, middle]
    }
    if (last) person.familyNames = [last]
    else throw new Error(`Unable to decode string "${data}" as a person`)
    if (suffix) person.honorificSuffix = suffix
    if (email) person.emails = [email]
    if (url) person.url = url
    return person
  }

  /**
   * Encode a `Person` to a `VFile`.
   *
   * @param node The `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    let content = ''

    if (is<stencila.Person>('Person')(node)) {
      if (node.honorificPrefix) content += node.honorificPrefix
      if (node.givenNames) content += ' ' + node.givenNames.join(' ')
      if (node.familyNames) content += ' ' + node.familyNames.join(' ')
      if (node.honorificSuffix) content += ' ' + node.honorificSuffix
      if (node.emails && node.emails[0]) content += ` <${node.emails[0]}>`
      if (node.url) content += ` (${node.url})`
      content = content.trim()
    } else {
      log.warn(
        `Expected a node of type "Person", got a node of type "${nodeType(
          node
        )}"`
      )
    }

    return vfile.load(content)
  }
}
