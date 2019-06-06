import stencila from '@stencila/schema'
import path from 'path'
import { read } from '../../src'

test('issue 89: throws an error if `horizontalRule ` present', async () => {
  const node = await read(path.join(__dirname, '89-gdoc-horizontalRule.gdoc'))
  const article = node as stencila.Article
  expect(article.type).toEqual('Article')
})
