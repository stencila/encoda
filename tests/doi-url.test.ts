import { parse, sniff, unparse } from '../src/doi-url'
import { load } from '../src/vfile'

test('sniff', async () => {
  expect(await sniff('http://doi.org/10.5334/jors.182')).toBe(true)
  expect(await sniff('https://doi.org/10.5334/jors.182')).toBe(true)

  expect(await sniff('http://foo.org/')).toBe(false)
})

const article = {
  content: `https://doi.org/10.5334/jors.182`,
  node: {
    type: 'Article',
    authors: [
      {
        type: 'Person',
        givenNames: ['Kristoffer'],
        familyNames: ['Carlsson']
      },
      {
        type: 'Person',
        givenNames: ['Fredrik'],
        familyNames: ['Ekre']
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(load(article.content))).toEqual(article.node)
})

test('unparse', async () => {
  await expect(unparse(article.node)).rejects.toThrow(
    /Unparsing to DOI URL is not yet implemented/
  )
})
