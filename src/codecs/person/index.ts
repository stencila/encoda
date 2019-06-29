/**
 * @module person
 */

import { Person } from '@stencila/schema'
//@ts-ignore
import parseAuthor from 'parse-author'
//@ts-ignore
import { parseFullName } from 'parse-full-name'

/**
 * Decode string data into a `Person`.
 *
 * @param data Data to decode
 */
export function decode(data: string): Person {
  const { name, email, url } = parseAuthor(data)
  const { title, first, middle, last, suffix } = parseFullName(name)
  const person: Person = { type: 'Person' }
  if (title) person.honorificPrefix = title
  if (first) {
    person.givenNames = [first]
    if (middle) person.givenNames.push(middle)
  }
  if (last) person.familyNames = [last]
  else throw new Error(`Unable to decode string "${data}" as a person`)
  if (suffix) person.honorificSuffix = suffix
  if (email) person.emails = [email]
  if (url) person.url = url
  return person
}
