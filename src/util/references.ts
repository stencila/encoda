import { CreativeWork, isA, Organization, Person } from '@stencila/schema'
import { array as A } from 'fp-ts'

/**
 * Create string for use in "numeric" in-text citations e.g. `[1]`.
 *
 * Will return "-1" if there are no references and "0" if the work
 * is not able to be found in the references
 */
export const encodeCiteNumeric = (
  work: CreativeWork | string,
  references: CreativeWork['references']
): string => {
  return `${(references?.indexOf(work) ?? -2) + 1}`
}

/**
 * Create string for "author-year" type in-text citations e.g. `Smith et al (1990)`.
 */
export const encodeCiteAuthorsYear = (work: CreativeWork): string => {
  const { authors = [], datePublished } = work
  let citeText = ''

  if (!A.isEmpty(authors)) {
    const firstAuthorName = getName(authors[0])
    if (firstAuthorName.length > 0) {
      citeText += firstAuthorName
      if (authors.length === 2) {
        const secondAuthorName = getName(authors[1])
        if (secondAuthorName.length > 0) citeText += ' and ' + secondAuthorName
      } else if (authors.length > 2) {
        citeText += ' et al.'
      }
    }
  }

  if (datePublished !== undefined) {
    const date =
      typeof datePublished === 'string' ? datePublished : datePublished.value
    const publishedYear = date.split('-')[0]
    citeText += `, ${publishedYear}`
  }

  return citeText
}

function getName(author: Person | Organization): string {
  return isA('Person', author) &&
    author.familyNames &&
    author.familyNames.length > 0
    ? author.familyNames.join(' ').trim()
    : (author.name ?? '').trim()
}
