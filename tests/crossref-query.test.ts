import { parse, unparse } from '../src/crossref-query'
import { load } from '../src/vfile'

jest.setTimeout(30 * 1000)

const article = {
  content: `Carlsson and Ekre, Tensor Computations in Julia`,
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
    /Unparsing to a Crossref query is not supported/
  )
})
