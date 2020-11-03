import { CreativeWork, isA, Organization, Person } from '@stencila/schema'
import { array as A } from 'fp-ts'

/**
 * Create text suitable for the `content` property of a `Cite` node from a `CreativeWork`.
 *
 * Currently this function only "author-date" type text citations e.g. `Smith et al (1990)`.
 * In the future, it may have an optional `style` argument to create other styles.
 */
export const encodeCiteContent = (work: CreativeWork): string => {
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
