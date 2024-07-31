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
  references: CreativeWork['references'],
): string => {
  return `${(references?.indexOf(work) ?? -2) + 1}`
}

/**
 * Create string for the authors part of in-text citations.
 * e.g. `Smith et al.` in `Smith et al. (1990)`.
 */
export const encodeCiteAuthors = (work: CreativeWork): string | undefined => {
  const { authors = [] } = work

  if (A.isEmpty(authors)) return undefined

  let citeText = ''
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
  return citeText
}

/**
 * Create string for the year part on in-text citations.
 * e.g. the `1990` in `Smith et al. (1990)`.
 */
export const encodeCiteYear = (work: CreativeWork): string | undefined => {
  const { datePublished } = work

  if (datePublished === undefined) return undefined

  const date =
    typeof datePublished === 'string' ? datePublished : datePublished.value
  return date.split('-')[0]
}

/**
 * Create string for "author-year" type citations within
 * a citation group e.g. `Smith et al., 1990`.
 */
export const encodeCiteAuthorsYear = (work: CreativeWork): string => {
  const authors = encodeCiteAuthors(work) ?? ''
  const year = encodeCiteYear(work)
  return year !== undefined ? `${authors}, ${year}` : authors
}

/**
 * Get the name of a person or organization to use in an in-text citation.
 */
function getName(author: Person | Organization): string {
  return isA('Person', author) &&
    author.familyNames &&
    author.familyNames.length > 0
    ? author.familyNames.join(' ').trim()
    : (author.name ?? '').trim()
}
