/**
 * @module person
 */

import * as stencila from '@stencila/schema'
// @ts-ignore
import parseAuthor from 'parse-author'
// @ts-ignore
import { parseFullName } from 'parse-full-name'
import * as vfile from '../../util/vfile'
import { Encode } from '../..';
import { is, nodeType } from '@stencila/schema/dist/util';
import log from '../../log'

export const mediaTypes = ['text/x-person']

export const extNames = ['person']

export async function sniff(content: string) {
  return /^\s*[A-Z][a-z.]*(\s+[A-Z][a-z.]*)+(\s+<[\w-_@.]+>)?\s*$/.test(content)
}

/**
 * Decode a `VFile` with string content to a `Person`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Person> {
  return decodeSync(await vfile.dump(file))
}

/**
 * Decode string data into a `Person`.
 *
 * @param data Data to decode
 */
export function decodeSync(data: string): stencila.Person {
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
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
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
    log.warn(`Expected a node of type "Person", got a node of type "${nodeType(node)}"`)
  }

  return vfile.load(content)
}
