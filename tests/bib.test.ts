import { parse, unparse } from '../src/bib'
import { load } from '../src/vfile'

const article = {
  content: `@article{id,
  author = {First Author and Second S. Author}
}`,
  /*
  title = {The title of the article},
  journal = {The Journal Title},
  volume = {2},
  number = {3},
  year = {2019},
  pages = {101-191},
  keywords = {first; second; third}
*/ node: {
    type: 'Article',
    authors: [
      {
        type: 'Person',
        givenNames: ['First'],
        familyNames: ['Author']
      },
      {
        type: 'Person',
        givenNames: ['Second', 'S.'],
        familyNames: ['Author']
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(load(article.content))).toEqual(article.node)
})

test('unparse', async () => {
  await expect(unparse(article.node)).rejects.toThrow(
    /Unparsing to bibtex is not yet implemented/
  )
})
