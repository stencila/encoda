import { parse, unparse } from '../src/bib'
import { dump, load } from '../src/vfile'

const article = {
  content: `@article{article1,
    author = {First Author and Second S. Author},
    title = {The title of the article},
    journal = {The Journal Title},
    volume = {2},
    number = {3},
    year = {2019},
    pages = {101-191},
    keywords = {first; second; third}
  }`,
  node: {
    type: 'Article',
    id: 'article1'
  }
}

test.skip('parse', async () => {
  expect(await parse(load(article.content))).toEqual(article.node)
})

test.skip('unparse', async () => {
  expect(dump(await unparse(article.node))).toEqual(article.content)
})
