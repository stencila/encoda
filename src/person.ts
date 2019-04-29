/**
 * Compiler for a string representing a person
 */

import stencila, { Person, validate } from '@stencila/schema'
// @ts-ignore
import parseAuthor from 'parse-author'
// @ts-ignore
import { parseFullName } from 'parse-full-name'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/x-person']

export const extNames = ['person']

export async function sniff(content: string) {
  return /^\s*[A-Z][a-z.]*(\s+[A-Z][a-z.]*)+\s*$/.test(content)
}

export async function parse(file: VFile): Promise<stencila.Node> {
  const content = dump(file)
  const { name, email, url } = parseAuthor(content)
  const { title, first, middle, last, suffix } = parseFullName(name)

  const person: Person = { type: 'Person' }
  if (title) person.honorificPrefix = title
  if (first) {
    person.givenNames = [first]
    if (middle) person.givenNames.push(middle)
  }
  if (last) person.familyNames = [last]
  else throw new Error(`Unable to parse string "${content}" as a person`)
  if (suffix) person.honorificSuffix = suffix
  if (email) person.emails = [email]
  if (url) person.url = url

  return validate(person, 'Person')
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  const person = validate(node, 'Person')

  let content = ''
  if (person.honorificPrefix) content += person.honorificPrefix
  if (person.givenNames) content += ' ' + person.givenNames.join(' ')
  if (person.familyNames) content += ' ' + person.familyNames.join(' ')
  if (person.honorificSuffix) content += ' ' + person.honorificSuffix
  if (person.emails && person.emails[0]) content += ` <${person.emails[0]}>`
  if (person.url) content += ` (${person.url})`
  content = content.trim()

  return load(content)
}
