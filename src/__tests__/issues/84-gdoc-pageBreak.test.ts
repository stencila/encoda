import stencila from '@stencila/schema'
import path from 'path'
import { read } from '../..'

test('issue 84: that a pageBreak in a GDoc gets decoded without error', async () => {
  // Prior to fix, this raised the eror:
  //  Unhandled element type {"startIndex":8,"endIndex":9,"pageBreak":{"textStyle":{}}}
  const node = await read(path.join(__dirname, '84-gdoc-pageBreak.gdoc'))
  const article = node as stencila.Article

  expect(article.type).toEqual('Article')
  expect(article.content).toEqual([
    {
      type: 'Paragraph',
      content: ['Page 1'],
    },
    {
      type: 'Paragraph',
      content: ['* * *', null],
    },
    {
      type: 'Paragraph',
      content: ['Page 2'],
    },
  ])
})
