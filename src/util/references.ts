import { CreativeWork, isA, Person } from '@stencila/schema'
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
    const people = authors.filter((p) => isA('Person', p))

    if (!A.isEmpty(people)) {
      const firstPerson = people[0] as Person
      let secondPerson

      if (firstPerson.familyNames) {
        citeText += firstPerson.familyNames.join(' ')

        if (people.length === 2) {
          secondPerson = people[1] as Person
          if (secondPerson.familyNames)
            citeText += ' and ' + secondPerson.familyNames.join(' ')
        } else if (people.length > 2) {
          citeText += ' et al.'
        }
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
